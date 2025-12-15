const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es obligatorio'],
  },
  description: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
  },
  price: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [0, 'El precio no puede ser negativo'],
  },
  type: {
    type: String,
    required: [true, 'El tipo de inmueble es obligatorio'],
    enum: {
      values: ['apartamento', 'casa', 'habitacion', 'otro'], // Asegúrate de incluir 'habitacion'
      message: 'Tipo de inmueble no válido. Debe ser: apartamento, casa, habitacion o otro'
    }
  },
  location: {
    type: {
      type: String, // Don't do `{ location: String }`!
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  images: [{
    public_id: String, // ID de la imagen en Cloudinary
    url: String,       // URL de la imagen en Cloudinary
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Opcional: Añadir más campos como capacidad, servicios, estado de publicación, etc.
  // published: { type: Boolean, default: true },
  // capacity: { type: Number, required: false },
  // amenities: [String], // Ej: ['wifi', 'piscina', 'aire_acondicionado']

}, {
  timestamps: true // Añade createdAt y updatedAt automáticamente
});

// Opcional: Crear un índice geoespacial para búsquedas por ubicación
// propertySchema.index({ "location": "2dsphere" });

module.exports = mongoose.model('Property', propertySchema);