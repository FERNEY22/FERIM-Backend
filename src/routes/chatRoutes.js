const express = require('express');
const router = express.Router();
const { addChat, getChats, deleteChat, askChat } = require('../controllers/chatController');

// Banco de preguntas/respuestas de NILA
router.post('/add', addChat);     // Agregar par pregunta/respuesta
router.get('/', getChats);        // Listar todos
router.post('/ask', askChat);     // Consultar (match tolerante) -> respuesta de NILA
router.delete('/:id', deleteChat); // Eliminar un par

module.exports = router;
