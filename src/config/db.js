const mongoose = require('mongoose');
require('dotenv').config(); // Asegura que las variables de entorno se carguen

const connectDB = async () => {
  try {
    // Usar la URI de conexión desde las variables de entorno
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Termina la aplicación si no se puede conectar
  }
};

module.exports = connectDB;