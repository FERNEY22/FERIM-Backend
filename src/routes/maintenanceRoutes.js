const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Importa el middleware de autenticación
const {
  createMaintenanceRequest,
  getUserMaintenanceRequests,
  getTechnicianMaintenanceRequests,
  updateMaintenanceStatus,
  validateUser
} = require('../controllers/maintenanceController'); // Importa el controlador de mantenimiento

// Ruta para crear una nueva solicitud de mantenimiento: POST /api/maintenance
// Requiere autenticación (debe ser un inquilino o propietario)
router.post('/', auth, createMaintenanceRequest);

// Ruta para obtener todas las solicitudes de mantenimiento de un usuario (inquilino o propietario): GET /api/maintenance/user
// Requiere autenticación
router.get('/user', auth, getUserMaintenanceRequests);

// Ruta para obtener todas las solicitudes de mantenimiento asignadas a un técnico: GET /api/maintenance/technician
// Requiere autenticación (debe ser un técnico)
router.get('/technician', auth, getTechnicianMaintenanceRequests);

// Ruta para actualizar el estado de una solicitud de mantenimiento: PUT /api/maintenance/:id
// Requiere autenticación (debe ser el técnico asignado o el propietario)
router.put('/:id', auth, updateMaintenanceStatus);

// Validar si un email pertenece a un usuario registrado (inquilino o propietario)
router.post('/validate-user', validateUser);

module.exports = router;