const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Importa el middleware de autenticación
const {
  createProperty,
  getAllProperties,
  getPropertyById,
  getMyProperties,
  updateProperty,
  deleteProperty
} = require('../controllers/propertyController'); // Importa el controlador de propiedades

const { upload } = require('../middleware/uploadImage'); // Importa el middleware de subida de imágenes

// Ruta para crear una nueva propiedad: POST /api/properties
// Requiere autenticación
//router.post('/', auth, upload.array('images', 5), createProperty);
router.post('/', auth, (req, res, next) => {
  console.log('FILES:', req.files);
  console.log('BODY:', req.body);
  next();
}, upload.array('images', 5), createProperty);

// Ruta para obtener todas las propiedades: GET /api/properties
// No requiere autenticación
router.get('/', getAllProperties);

// Ruta para obtener propiedades del propietario autenticado: GET /api/properties/owner/me
router.get('/owner/me', auth, getMyProperties);

// Ruta para obtener una propiedad por ID: GET /api/properties/:id
// No requiere autenticación
router.get('/:id', getPropertyById);

// Ruta para editar una propiedad: PUT /api/properties/:id
router.put('/:id', auth, updateProperty);

// Ruta para eliminar una propiedad: DELETE /api/properties/:id
router.delete('/:id', auth, deleteProperty);

// Exporta el router
module.exports = router;