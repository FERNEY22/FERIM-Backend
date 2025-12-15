const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true // La propiedad a reservar es obligatoria
  },
  tenant: { // Cambiado de 'inquilino' a 'tenant' para consistencia
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // El inquilino que hace la reserva es obligatorio
  },
  owner: { // Propietario de la propiedad (para notificaciones y control)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // El propietario de la propiedad es obligatorio
  },
  startDate: {
    type: Date,
    required: [true, 'La fecha de inicio es obligatoria'] // Fecha de inicio de la estadía
  },
  endDate: {
    type: Date,
    required: [true, 'La fecha de fin es obligatoria'] // Fecha de fin de la estadía
  },
  status: {
    type: String,
    enum: {
      values: ['pendiente', 'aceptada', 'rechazada'], // Estados posibles de la reserva
      message: 'Estado de reserva no válido. Debe ser: pendiente, aceptada o rechazada'
    },
    default: 'pendiente', // Por defecto, una nueva solicitud está pendiente
    required: true
  },
  // Opcional: Puedes incluir campos como 'totalCost' si se calcula aquí
  // totalCost: { type: Number, required: false }, // Costo total calculado al momento de la reserva

}, {
  timestamps: true // Añade createdAt y updatedAt automáticamente
});

module.exports = mongoose.model('Reservation', reservationSchema);