const Property = require('../models/Property'); // Importa el modelo Property
const User = require('../models/User'); // Importa el modelo User para verificar el propietario
const { uploadToCloudinary } = require('../middleware/uploadImage');

// Controlador para crear una nueva propiedad: POST /api/properties
// Requiere autenticación
exports.createProperty = async (req, res) => {
  try {
    let { title, description, price, type, location } = req.body;

    // Con multipart/form-data (cuando se suben imágenes) 'location' llega como
    // string JSON; lo parseamos a objeto GeoJSON antes de guardarlo.
    if (typeof location === 'string') {
      try {
        location = JSON.parse(location);
      } catch (e) {
        return res.status(400).json({ msg: 'Ubicación inválida' });
      }
    }

    // Verificar que el usuario autenticado sea propietario
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }
    if (user.role !== 'propietario') {
      return res.status(403).json({ msg: 'Acceso denegado. Solo propietarios pueden registrar propiedades.' });
    }

    // Subir imágenes a Cloudinary si se adjuntaron archivos
    let images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'ferim/properties');
        images.push({ public_id: result.public_id, url: result.secure_url });
      }
    }

    const newProperty = new Property({
      title,
      description,
      price,
      type,
      location,
      images,
      owner: user.id
    });

    const property = await newProperty.save();
    res.status(201).json(property);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// Controlador para obtener todas las propiedades: GET /api/properties
// No requiere autenticación
exports.getAllProperties = async (req, res) => {
  try {
    // Buscar todas las propiedades en la base de datos
    const properties = await Property.find()
                                    .populate('owner', 'name lastname') // Popula el campo owner con nombre y email
                                    .sort({ createdAt: -1 }); // Ordenar por fecha de creación, más recientes primero

    res.json(properties); // Devolver la lista de propiedades

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// Controlador para obtener una propiedad por ID: GET /api/properties/:id
// No requiere autenticación
exports.getPropertyById = async (req, res) => {
  try {
    // Buscar la propiedad por su ID
    const property = await Property.findById(req.params.id)
                                  .populate('owner', 'name lastname'); // Popula el propietario

    if (!property) {
        return res.status(404).json({ msg: 'Propiedad no encontrada' });
    }

    res.json(property); // Devolver la propiedad encontrada

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// Controlador para obtener propiedades del propietario autenticado: GET /api/properties/owner/me
exports.getMyProperties = async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user.id })
                                    .sort({ createdAt: -1 });
    res.json(properties);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// Controlador para editar una propiedad: PUT /api/properties/:id
exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ msg: 'Propiedad no encontrada' });
    }
    if (property.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'No autorizado' });
    }
    const updated = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// Controlador para eliminar una propiedad: DELETE /api/properties/:id
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ msg: 'Propiedad no encontrada' });
    }
    if (property.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'No autorizado' });
    }
    await Property.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Propiedad eliminada' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};