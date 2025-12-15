const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Carga las variables de entorno
const mongoose = require('mongoose');
const userRoutes = require('./src/routes/userRoutes'); // Importa las rutas de usuario

// Importa la función de conexión a la base de datos (ruta correcta dentro de src)
const connectDB = require('./src/config/db.js');

// IMPORTA las rutas de autenticación (ruta correcta dentro de src)
const authRoutes = require('./src/routes/authRoutes.js');
const propertyRoutes = require('./src/routes/propertyRoutes.js');
const reservationRoutes = require('./src/routes/reservationRoutes.js');
const maintenanceRoutes = require('./src/routes/maintenanceRoutes.js');

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

// USA las rutas de autenticación en el servidor
// Todas las rutas definidas en authRoutes se activarán bajo el prefijo '/api/auth'
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/maintenance', maintenanceRoutes);

app.use('/api/users', userRoutes);

// Define el puerto
const PORT = process.env.PORT || 5000;

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

