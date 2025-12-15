const express = require('express');
const router = express.Router();
const MaintenanceRequest = require('../models/MaintenanceRequest'); // Importa el modelo MaintenanceRequest
const Property = require('../models/Property'); // Importa el modelo Property para verificar la propiedad
const User = require('../models/User'); // Importa el modelo User para verificar el usuario que reporta
const auth = require('../middleware/auth'); // Importa el middleware de autenticación

// Ruta para crear una nueva solicitud de mantenimiento: POST /api/maintenance
// Requiere autenticación (debe ser un inquilino o propietario)
router.post('/', auth, async (req, res) => {
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
});

// Ruta para obtener todas las solicitudes de mantenimiento de un usuario (inquilino o propietario): GET /api/maintenance/user
// Requiere autenticación
router.get('/user', auth, async (req, res) => {
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
});

// Ruta para obtener todas las solicitudes de mantenimiento asignadas a un técnico: GET /api/maintenance/technician
// Requiere autenticación (debe ser un técnico)
router.get('/technician', auth, async (req, res) => {
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
});

// Ruta para actualizar el estado de una solicitud de mantenimiento: PUT /api/maintenance/:id
// Requiere autenticación (debe ser el técnico asignado o el propietario)
router.put('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;

    // Buscar la solicitud por ID
    let maintenanceRequest = await MaintenanceRequest.findById(req.params.id);
    if (!maintenanceRequest) {
      return res.status(404).json({ msg: 'Solicitud de mantenimiento no encontrada' });
    }

    // Verificar permisos: Técnico asignado o Propietario de la propiedad
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(401).json({ msg: 'Usuario no encontrado' });
    }

    const isTechnicianAssigned = maintenanceRequest.assignedTo && maintenanceRequest.assignedTo.toString() === req.user.id;
    const isPropertyOwner = maintenanceRequest.property.owner.toString() === req.user.id;

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
});


// Validar si un email pertenece a un usuario registrado (inquilino o propietario)
router.post('/validate-user', async (req, res) => {
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
});

module.exports = router;