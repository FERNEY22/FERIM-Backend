// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // Asegúrate que la ruta es correcta

// Define la ruta POST para crear un usuario
// Cuando se haga una petición POST a /api/users, se ejecutará userController.createUser
router.post('/', userController.createUser);

module.exports = router;