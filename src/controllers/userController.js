// controllers/userController.js
const User = require('../models/User'); // Asegúrate que la ruta es correcta

// Función para crear un nuevo usuario
exports.createUser = async (req, res) => {
  try {
    // 1. Extraer los datos del cuerpo de la petición
    const { name, lastname, email, password, role } = req.body;

    // 2. Crear una nueva instancia del usuario con los datos recibidos
    // El middleware pre('save') se encargará de encriptar la contraseña
    const newUser = new User({
      name,
      lastname,
      email,
      password, // La contraseña se guardará encriptada
      role
    });

    // 3. Guardar el usuario en la base de datos
    const userSaved = await newUser.save();

    // 4. Enviar una respuesta exitosa al cliente
    // El método toJSON() del esquema se encargará de ocultar la contraseña
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: userSaved
    });

  } catch (error) {
    console.error('Error al crear el usuario:', error); // Imprime el error en la consola del servidor para depuración

    // Manejo de errores específicos de Mongoose
    if (error.code === 11000) { // Error de duplicado (ej. email ya existe)
      return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });
    }

    if (error.name === 'ValidationError') { // Error de validación
      // Extraer y mostrar los mensajes de error de validación
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Error de validación', errors });
    }

    // Para cualquier otro error, enviar un error 500
    res.status(500).json({ message: 'Error interno del servidor al crear el usuario.' });
  }
};