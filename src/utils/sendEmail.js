const nodemailer = require('nodemailer');
require('dotenv').config();

// Configura el transporter de Nodemailer
const transporter = nodemailer.createTransporter({
  service: 'gmail', // Puedes usar otros servicios como Outlook, Yahoo, etc.
  auth: {
    user: process.env.EMAIL_USER, // Tu correo electrónico
    pass: process.env.EMAIL_PASS, // La contraseña de aplicación de tu correo
  },
});

// Función para enviar un correo electrónico
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html, // Puedes usar texto plano con 'text' en lugar de 'html'
    };

    await transporter.sendMail(mailOptions);
    console.log(`Correo enviado a: ${to}`);
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    throw new Error('Error al enviar el correo electrónico');
  }
};

module.exports = sendEmail;