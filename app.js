const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Carga las variables de entorno
const mongoose = require('mongoose');


// Importa la función de conexión a la base de datos (ruta correcta dentro de src)
//const connectDB = require('./src/config/db.js'); //cambiado 09 abril hora 853 pm

// IMPORTA las rutas de autenticación (ruta correcta dentro de src)
const authRoutes = require('./src/routes/authRoutes.js');
const propertyRoutes = require('./src/routes/propertyRoutes.js');
const reservationRoutes = require('./src/routes/reservationRoutes.js');
const maintenanceRoutes = require('./src/routes/maintenanceRoutes.js');
const chatRoutes = require('./src/routes/chatRoutes.js');

// Inicializa Express
const app = express();

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Para parsear formularios

// Middleware para habilitar CORS (para que el frontend pueda hacer peticiones)
app.use(cors());

// Conecta a la base de datos
//connectDB();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Ruta de prueba raíz
app.get('/', (req, res) => {
  res.send('¡Backend de FERIM funcionando!');
});

// Endpoint de salud para keep-alive (UptimeRobot). No toca la base de datos:
// responde rápido y barato, solo para evitar que Render free se duerma.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// USA las rutas de autenticación en el servidor
// Todas las rutas definidas en authRoutes se activarán bajo el prefijo '/api/auth'
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/chats', chatRoutes);



// Define el puerto
const PORT = process.env.PORT || 5000;

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

