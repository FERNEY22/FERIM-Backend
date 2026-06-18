const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
require('dotenv').config();

// Función para registrar un nuevo usuario
const registerUser = async (req, res) => {
  const { name, lastname, email, password, role } = req.body;

  // Normalizar email a string (evita inyección NoSQL por operadores en el body)
  const safeEmail = String(email || '').toLowerCase().trim();

  // Lista blanca de roles auto-registrables. Los tres roles del producto pueden
  // registrarse; cualquier valor fuera de la lista (o un objeto inyectado) cae a
  // 'inquilino'. Esto mantiene la validación de rol del lado servidor y evita la
  // inyección de roles arbitrarios. (Mitiga C1; ver nota sobre flujo admin.)
  const SELF_REGISTRABLE_ROLES = ['inquilino', 'propietario', 'tecnico'];
  const safeRole = SELF_REGISTRABLE_ROLES.includes(role) ? role : 'inquilino';

  try {
    // Verificar si el usuario ya existe
    let user = await User.findOne({ email: safeEmail });
    if (user) {
      return res.status(400).json({ msg: 'El usuario ya existe' });
    }

    // Crear un nuevo usuario
    user = new User({
      name,
      lastname,
      email: safeEmail,
      password,
      role: safeRole,
    });

    // Encriptar la contraseña
    //const salt = await bcrypt.genSalt(10);
    //user.password = await bcrypt.hash(password, salt);

    // Guardar el usuario en la base de datos
    await user.save();

    // Correo de bienvenida/confirmación. Best-effort: si el envío falla
    // (p. ej. SMTP caído), NO debe romper el registro.
    sendEmail(
      user.email,
      'Bienvenido a FERIM',
      `<h2>¡Registro exitoso! 🎉</h2>
       <p>Hola <strong>${user.name}</strong>, tu cuenta en FERIM fue creada correctamente con el rol <strong>${user.role}</strong>.</p>
       <p>Ya puedes iniciar sesión y empezar a usar la plataforma.</p>`
    ).catch((e) => console.error('No se pudo enviar el correo de bienvenida:', e.message));

    // Generar un token JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }, // El token expira en 7 días
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// Función para iniciar sesión
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const safeEmail = String(email || '').toLowerCase().trim();

  try {
    // Verificar si el usuario existe
    let user = await User.findOne({ email: safeEmail }).select('+password');
    if (!user) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    // Verificar la contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
    return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    // Generar un token JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token,
                    user: { // Devolver datos del usuario es útil para el frontend
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role} 
                      });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// Función para obtener el usuario autenticado (sin password): GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// Listar técnicos (para que el propietario pueda asignarlos): GET /api/auth/technicians
const getTechnicians = async (req, res) => {
  try {
    const requester = await User.findById(req.user.id).select('role');
    if (!requester || requester.role !== 'propietario') {
      return res.status(403).json({ msg: 'Acceso denegado.' });
    }
    const technicians = await User.find({ role: 'tecnico' }).select('name lastname');
    res.json(technicians);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

module.exports = { registerUser, loginUser, getMe, getTechnicians };

