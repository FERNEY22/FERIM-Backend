const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Importa el middleware de autenticación
const {
  createReservation,
  getTenantReservations,
  getOwnerReservations,
  updateReservationStatus,
  validateTenant
} = require('../controllers/reservationController'); // Importa el controlador de reservaciones

// Ruta para crear una nueva solicitud de reserva: POST /api/reservations
// Requiere autenticación (debe ser un inquilino)
router.post('/', auth, createReservation);

// Ruta para obtener todas las reservas de un inquilino: GET /api/reservations/tenant
// Requiere autenticación
router.get('/tenant', auth, getTenantReservations);

// Ruta para obtener todas las reservas de propiedades de un propietario: GET /api/reservations/owner
// Requiere autenticación
router.get('/owner', auth, getOwnerReservations);

// Ruta para actualizar el estado de una reserva (Aceptar/Rechazar): PUT /api/reservations/:id
// Requiere autenticación (debe ser el propietario de la propiedad)
router.put('/:id', auth, updateReservationStatus);

//new added 14-12-25
// Validar si un email pertenece a un inquilino registrado
router.post('/validate-tenant', validateTenant);

module.exports = router;