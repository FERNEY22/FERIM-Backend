const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
  },
  lastname: { // Cambiado de 'apellido' a 'lastname'
    type: String,
    required: [true, 'El apellido es obligatorio'], // Mensaje de error actualizado
  },
  email: {
    type: String,
    required: [true, 'El correo electrónico es obligatorio'],
    unique: true, // Asegura que no haya dos usuarios con el mismo email
    lowercase: true, // Guarda el email en minúsculas
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'], // Opcional: longitud mínima
    select: false
  },
  role: {
    type: String,
    enum: ['propietario', 'inquilino', 'tecnico'], // Define los roles válidos
    default: 'inquilino', // Asigna 'inquilino' por defecto
    required: true, // Es obligatorio
  },
  // Opcional: Agregar campos como 'avatar', 'fecha_registro', etc.
  // createdAt y updatedAt se manejan automáticamente con 'timestamps: true'
});

// Middleware de Mongoose para encriptar la contraseña antes de guardar el usuario
UserSchema.pre('save', async function (next) {
  // Solo encriptar si la contraseña fue modificada (o es nueva)
  if (!this.isModified('password')) {
    next();
  }

  try {
    // Generar el salt (costo 10 es el predeterminado y recomendado)
    const salt = await bcrypt.genSalt(10);
    // Encriptar la contraseña
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar la contraseña introducida con la almacenada encriptada
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Opcional: Método para ocultar la contraseña al devolver el objeto (por ejemplo, en JSON)
UserSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password; // Elimina el campo password del objeto devuelto
  return userObject;
};

module.exports = mongoose.model('User', UserSchema);