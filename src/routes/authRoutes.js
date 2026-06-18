const express = require('express');
const router = express.Router(); // Usamos Router de Express
const { registerUser, loginUser, getMe, getTechnicians } = require('../controllers/authController'); // Importamos las funciones desde authController
const auth = require('../middleware/auth');

// Ruta para el registro de usuarios: POST /api/auth/register
router.post('/register', registerUser);
// Ruta para el inicio de sesión de usuarios: POST /api/auth/login
router.post('/login', loginUser);
// Ruta para obtener el usuario autenticado: GET /api/auth/me
router.get('/me', auth, getMe);
// Ruta para listar técnicos (propietario asigna): GET /api/auth/technicians
router.get('/technicians', auth, getTechnicians);
// Exportamos el router para poder usarlo en otros archivos (como app.js)
module.exports = router;
