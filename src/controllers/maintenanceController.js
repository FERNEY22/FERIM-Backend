const MaintenanceRequest = require('../models/MaintenanceRequest'); // Importa el modelo MaintenanceRequest
const Property = require('../models/Property'); // Importa el modelo Property para verificar la propiedad
const User = require('../models/User'); // Importa el modelo User para verificar el usuario que reporta

// Controlador para crear una nueva solicitud de mantenimiento: POST /api/maintenance
// Requiere autenticación (debe ser un inquilino o propietario)
exports.createMaintenanceRequest = async (req, res) => {
  try {
    const { propertyId, description, type, images } = req.body;

    // Verificar que el usuario autenticado sea inquilino o propietario
    const user = await User.findById(req.user.id).select('-password');
    if (!user || (user.role !== 'inquilino' && user.role !== 'propietario')) {
      return res.status(401).json({ msg: 'Permiso denegado. Solo inquilinos o propietarios pueden crear solicitudes de mantenimiento.' });
    }

    // Verificar que la propiedad exista
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ msg: 'Propiedad no encontrada' });
    }

    // Verificar que el usuario sea el propietario o inquilino de la propiedad (opcional, dependiendo del flujo)
    // if (property.owner.toString() !== req.user.id && !property.tenants.includes(req.user.id)) {
    //   return res.status(401).json({ msg: 'No tienes permiso para reportar mantenimiento en esta propiedad.' });
    // }

    // Crear una nueva instancia del modelo MaintenanceRequest
    const newMaintenanceRequest = new MaintenanceRequest({
      property: propertyId,
      reportedBy: user.id, // El usuario que reporta es el autenticado
      assignedTo: null, // Inicialmente no hay técnico asignado
      description,
      type: type || null, // Tipo de falla (opcional)
      images: images || [], // Imágenes adjuntas (opcional)
      status: 'pendiente' // Estado inicial es pendiente
    });

    // Guardar la solicitud en la base de datos
    const maintenanceRequest = await newMaintenanceRequest.save();

    // Opcional: Puedes enviar una notificación por correo aquí
    // await sendMaintenanceNotification(maintenanceRequest._id);

    res.json(maintenanceRequest); // Devolver la solicitud creada

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// Controlador para obtener todas las solicitudes de mantenimiento de un usuario (inquilino o propietario): GET /api/maintenance/user
// Requiere autenticación
exports.getUserMaintenanceRequests = async (req, res) => {
  try {
    // Buscar todas las solicitudes donde el usuario sea 'reportedBy'
    const maintenanceRequests = await MaintenanceRequest.find({ reportedBy: req.user.id })
                                                       .populate('property', 'title description price type location')
                                                       .populate('assignedTo', 'name lastname email')
                                                       .sort({ createdAt: -1 }); // Ordenar por fecha de creación, más recientes primero

    res.json(maintenanceRequests); // Devolver la lista de solicitudes

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// Controlador para obtener todas las solicitudes de mantenimiento asignadas a un técnico: GET /api/maintenance/technician
// Requiere autenticación (debe ser un técnico)
exports.getTechnicianMaintenanceRequests = async (req, res) => {
  try {
    // Verificar que el usuario autenticado sea un técnico
    const user = await User.findById(req.user.id).select('-password');
    if (!user || user.role !== 'tecnico') {
      return res.status(401).json({ msg: 'Permiso denegado. Solo técnicos pueden ver sus solicitudes asignadas.' });
    }

    // Buscar todas las solicitudes donde el usuario sea 'assignedTo'
    const maintenanceRequests = await MaintenanceRequest.find({ assignedTo: req.user.id })
                                                       .populate('property', 'title description price type location')
                                                       .populate('reportedBy', 'name lastname email')
                                                       .sort({ createdAt: -1 }); // Ordenar por fecha de creación, más recientes primero

    res.json(maintenanceRequests); // Devolver la lista de solicitudes

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// Controlador para obtener las solicitudes de mantenimiento de las propiedades
// de un propietario (reportadas por sus inquilinos): GET /api/maintenance/owner
exports.getOwnerPropertyMaintenance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user || user.role !== 'propietario') {
      return res.status(401).json({ msg: 'Permiso denegado. Solo propietarios.' });
    }

    // IDs de las propiedades del propietario
    const props = await Property.find({ owner: req.user.id }).select('_id');
    const propertyIds = props.map((p) => p._id);

    const maintenanceRequests = await MaintenanceRequest.find({ property: { $in: propertyIds } })
      .populate('property', 'title location')
      .populate('reportedBy', 'name lastname email')
      .populate('assignedTo', 'name lastname email')
      .sort({ createdAt: -1 });

    res.json(maintenanceRequests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// Controlador para asignar un técnico a una solicitud: PUT /api/maintenance/:id/assign
// Requiere autenticación (debe ser el propietario de la propiedad)
exports.assignTechnician = async (req, res) => {
  try {
    const { technicianId } = req.body;

    const user = await User.findById(req.user.id).select('role');
    if (!user || user.role !== 'propietario') {
      return res.status(401).json({ msg: 'Permiso denegado. Solo propietarios pueden asignar técnicos.' });
    }

    let maintenanceRequest = await MaintenanceRequest.findById(req.params.id).populate('property', 'owner');
    if (!maintenanceRequest) {
      return res.status(404).json({ msg: 'Solicitud de mantenimiento no encontrada' });
    }

    const ownerId = maintenanceRequest.property && maintenanceRequest.property.owner;
    if (!ownerId || ownerId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'No eres el propietario de esta propiedad.' });
    }

    // Validar que el técnico exista y tenga rol 'tecnico'
    const technician = await User.findById(technicianId).select('role');
    if (!technician || technician.role !== 'tecnico') {
      return res.status(400).json({ msg: 'Técnico no válido.' });
    }

    maintenanceRequest.assignedTo = technicianId;
    // Al asignar, si seguía pendiente pasa a en_progreso
    if (maintenanceRequest.status === 'pendiente') {
      maintenanceRequest.status = 'en_progreso';
    }
    await maintenanceRequest.save();

    const updated = await MaintenanceRequest.findById(maintenanceRequest._id)
      .populate('property', 'title location')
      .populate('reportedBy', 'name lastname email')
      .populate('assignedTo', 'name lastname email');

    res.json(updated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// Controlador para actualizar el estado de una solicitud de mantenimiento: PUT /api/maintenance/:id
// Requiere autenticación (debe ser el técnico asignado o el propietario)
exports.updateMaintenanceStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Buscar la solicitud por ID. Se popula 'property' para poder leer su 'owner'
    // (antes se accedía a property.owner sin popular -> property era un ObjectId
    // y .owner era undefined, provocando un 500. Corrige M1).
    let maintenanceRequest = await MaintenanceRequest.findById(req.params.id).populate('property', 'owner');
    if (!maintenanceRequest) {
      return res.status(404).json({ msg: 'Solicitud de mantenimiento no encontrada' });
    }

    // Verificar permisos: Técnico asignado o Propietario de la propiedad
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(401).json({ msg: 'Usuario no encontrado' });
    }

    const ownerId = maintenanceRequest.property && maintenanceRequest.property.owner;
    const isTechnicianAssigned = maintenanceRequest.assignedTo && maintenanceRequest.assignedTo.toString() === req.user.id;
    const isPropertyOwner = ownerId && ownerId.toString() === req.user.id;

    if (!isTechnicianAssigned && !isPropertyOwner) {
      return res.status(401).json({ msg: 'Permiso denegado. Solo técnicos asignados o propietarios pueden actualizar el estado.' });
    }

    // Verificar que el estado sea válido
    if (!['pendiente', 'en_progreso', 'resuelto', 'cerrado'].includes(status)) {
      return res.status(400).json({ msg: 'Estado de mantenimiento no válido' });
    }

    // Actualizar el estado de la solicitud
    maintenanceRequest.status = status;

    // Opcional: Agregar al historial
    // maintenanceRequest.history.push({
    //   status: status,
    //   changedBy: req.user.id,
    //   date: new Date()
    // });

    maintenanceRequest = await maintenanceRequest.save();

    // Opcional: Puedes enviar una notificación por correo aquí
    // await sendMaintenanceStatusUpdate(maintenanceRequest._id, status);

    res.json(maintenanceRequest); // Devolver la solicitud actualizada

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// Controlador para validar si un email pertenece a un usuario registrado (inquilino o propietario)
exports.validateUser = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ valid: false, message: 'Email es requerido.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ valid: false, message: 'Email no registrado.' });
    }

    if (user.role !== 'inquilino' && user.role !== 'propietario') {
      return res.status(403).json({ valid: false, message: 'Solo inquilinos o propietarios pueden solicitar mantenimiento.' });
    }

    return res.json({ valid: true, message: 'Usuario válido.' });
  } catch (err) {
    console.error('Error en validación:', err);
    return res.status(500).json({ valid: false, message: 'Error interno.' });
  }
};