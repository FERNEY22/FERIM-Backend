const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware para verificar el token JWT
const auth = (req, res, next) => {
  // Leer el token del header 'x-auth-token'
  const token = req.header('x-auth-token');

  // Si no hay token, denegar acceso
  if (!token) {
    return res.status(401).json({ msg: 'No hay token, permiso denegado' });
  }

  try {
    // Verificar el token usando la clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Añadir el ID del usuario decodificado al objeto req.user
    req.user = decoded.user;
    // Llamar a next() para continuar con la siguiente función (controlador)
    next();
  } catch (err) {
    // Si el token es inválido
    res.status(401).json({ msg: 'Token no válido' });
  }
};

module.exports = auth;


