const mongoose = require('mongoose');

// Banco de preguntas/respuestas que alimenta a NILA (chatbot de FERIM).
// Basado en el chatbot de la clase de arquitectura, integrado al backend de FERIM.
const chatSchema = new mongoose.Schema(
  {
    question: { type: String, required: [true, 'La pregunta es obligatoria'] },
    answer: { type: String, required: [true, 'La respuesta es obligatoria'] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Chat', chatSchema);
