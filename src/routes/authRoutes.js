const express = require('express');
const router = express.Router(); // Usamos Router de Express
const { registerUser, loginUser } = require('../controllers/authController'); // Importamos las funciones desde authController


//añadido 1-12-2025
//const auth = require('../middleware/auth');
// Ruta para el registro de usuarios: POST /api/auth/register
router.post('/register', registerUser);
// Ruta para el inicio de sesión de usuarios: POST /api/auth/login
router.post('/login', loginUser);
// Exportamos el router para poder usarlo en otros archivos (como app.js)
module.exports = router;
