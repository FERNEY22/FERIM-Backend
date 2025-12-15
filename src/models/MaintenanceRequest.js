const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true // La propiedad donde ocurre la falla es obligatoria
  },
  // El inquilino o propietario que reporta la falla
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Quien reporta es obligatorio
  },
  // El técnico asignado para resolver la falla (puede ser asignado después)
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // No es requerido inicialmente, puede asignarse después
  },
  // Descripción del problema
  description: {
    type: String,
    required: [true, 'La descripción del problema es obligatoria'] // Descripción es obligatoria
  },
  // Tipo de falla (opcional, pero útil para categorizar)
  type: {
    type: String,
    enum: {
      values: ['plomeria', 'electricidad', 'estructural', 'pintura', 'otros'],
      message: 'Tipo de falla no válido. Debe ser: plomeria, electricidad, estructural, pintura u otros'
    },
    required: false // No es obligatorio, pero útil para filtrar
  },
  // Estado de la solicitud
  status: {
    type: String,
    enum: {
      values: ['pendiente', 'en_progreso', 'resuelto', 'cerrado'], // Estados posibles
      message: 'Estado de mantenimiento no válido. Debe ser: pendiente, en_progreso, resuelto o cerrado'
    },
    default: 'pendiente', // Por defecto, una nueva solicitud está pendiente
    required: true
  },
  // Imágenes adjuntas (opcional)
  images: [{
    public_id: String, // ID de la imagen en Cloudinary
    url: String,       // URL de la imagen en Cloudinary
  }],
  // Historial de estados (opcional, para trazabilidad)
  history: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now }
  }]

}, {
  timestamps: true // Añade createdAt y updatedAt automáticamente
});

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);