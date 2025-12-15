const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation'); // Importa el modelo Reservation
const Property = require('../models/Property'); // Importa el modelo Property para verificar la propiedad
const User = require('../models/User'); // Importa el modelo User para verificar el inquilino y propietario
const auth = require('../middleware/auth'); // Importa el middleware de autenticación

// Ruta para crear una nueva solicitud de reserva: POST /api/reservations
// Requiere autenticación (debe ser un inquilino)
router.post('/', auth, async (req, res) => {
  try {
    const { propertyId, startDate, endDate } = req.body;

    // Verificar que el usuario autenticado es un inquilino
    const user = await User.findById(req.user.id).select('-password');
    if (!user || user.role !== 'inquilino') {
      return res.status(401).json({ msg: 'Permiso denegado. Solo inquilinos pueden crear reservas.' });
    }

    // Verificar que la propiedad exista y esté disponible
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ msg: 'Propiedad no encontrada' });
    }

    // Verificar que la fecha de inicio sea anterior a la fecha de fin
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ msg: 'La fecha de inicio debe ser anterior a la fecha de fin' });
    }

    // Verificar que no haya solapamiento de fechas con reservas existentes
    const existingReservation = await Reservation.findOne({
      property: propertyId,
      status: { $in: ['pendiente', 'aceptada'] }, // Solo considerar reservas activas o pendientes
      $or: [
        { startDate: { $gte: new Date(startDate), $lt: new Date(endDate) } },
        { endDate: { $gt: new Date(startDate), $lte: new Date(endDate) } },
        { startDate: { $lte: new Date(startDate) }, endDate: { $gte: new Date(endDate) } }
      ]
    });

    if (existingReservation) {
      return res.status(400).json({ msg: 'La propiedad ya está reservada para las fechas seleccionadas' });
    }

    // Crear una nueva instancia del modelo Reservation
    const newReservation = new Reservation({
      property: propertyId,
      tenant: user.id, // El inquilino es el usuario autenticado
      owner: property.owner, // El propietario es el dueño de la propiedad
      startDate,
      endDate,
      status: 'pendiente' // Por defecto, la nueva reserva está pendiente
    });

    // Guardar la reserva en la base de datos
    const reservation = await newReservation.save();

    // Opcional: Puedes enviar una notificación por correo al propietario aquí
    // await sendReservationNotificationToOwner(property.owner, reservation._id);

    res.json(reservation); // Devolver la reserva creada

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

// Ruta para obtener todas las reservas de un inquilino: GET /api/reservations/tenant
// Requiere autenticación
router.get('/tenant', auth, async (req, res) => {
  try {
    // Verificar que el usuario autenticado es un inquilino
    const user = await User.findById(req.user.id).select('-password');
    if (!user || user.role !== 'inquilino') {
      return res.status(401).json({ msg: 'Permiso denegado. Solo inquilinos pueden ver sus reservas.' });
    }

    // Buscar todas las reservas del inquilino autenticado
    const reservations = await Reservation.find({ tenant: req.user.id })
                                          .populate('property', 'title description price type location')
                                          .populate('owner', 'name lastname email')
                                          .sort({ createdAt: -1 }); // Ordenar por fecha de creación, más recientes primero

    res.json(reservations); // Devolver la lista de reservas

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

// Ruta para obtener todas las reservas de propiedades de un propietario: GET /api/reservations/owner
// Requiere autenticación
router.get('/owner', auth, async (req, res) => {
  try {
    // Verificar que el usuario autenticado es un propietario
    const user = await User.findById(req.user.id).select('-password');
    if (!user || user.role !== 'propietario') {
      return res.status(401).json({ msg: 'Permiso denegado. Solo propietarios pueden ver las reservas de sus propiedades.' });
    }

    // Buscar todas las reservas para propiedades del propietario autenticado
    const reservations = await Reservation.find({ owner: req.user.id })
                                          .populate('property', 'title description price type location')
                                          .populate('tenant', 'name lastname email')
                                          .sort({ createdAt: -1 }); // Ordenar por fecha de creación, más recientes primero

    res.json(reservations); // Devolver la lista de reservas

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

// Ruta para actualizar el estado de una reserva (Aceptar/Rechazar): PUT /api/reservations/:id
// Requiere autenticación (debe ser el propietario de la propiedad)
router.put('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;

    // Verificar que el usuario autenticado sea propietario
    const user = await User.findById(req.user.id).select('-password');
    if (!user || user.role !== 'propietario') {
      return res.status(401).json({ msg: 'Permiso denegado. Solo propietarios pueden gestionar reservas.' });
    }

    // Buscar la reserva por ID
    let reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ msg: 'Reserva no encontrada' });
    }

    // Verificar que el propietario autenticado sea el dueño de la propiedad de la reserva
    if (reservation.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Permiso denegado. No eres el propietario de esta propiedad.' });
    }

    // Verificar que el estado sea válido
    if (!['pendiente', 'aceptada', 'rechazada'].includes(status)) {
      return res.status(400).json({ msg: 'Estado de reserva no válido' });
    }

    // Actualizar el estado de la reserva
    reservation.status = status;
    reservation = await reservation.save();

    // Opcional: Puedes enviar una notificación por correo al inquilino aquí
    // await sendReservationStatusUpdateToTenant(reservation.tenant, reservation._id, status);

    res.json(reservation); // Devolver la reserva actualizada

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

//new added 14-12-25
    // Validar si un email pertenece a un inquilino registrado
    router.post('/validate-tenant', async (req, res) => {
      try {
        const { email } = req.body;
        if (!email) {
          return res.status(400).json({ valid: false, message: 'Email es requerido.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
          return res.status(404).json({ valid: false, message: 'Email no registrado.' });
        }

        if (user.role !== 'inquilino') {
          return res.status(403).json({ valid: false, message: 'Solo inquilinos pueden hacer reservas.' });
        }

        return res.json({ valid: true, message: 'Usuario válido.' });
      } catch (err) {
        console.error('Error en validación:', err);
        return res.status(500).json({ valid: false, message: 'Error interno.' });
      }
    });



module.exports = router;