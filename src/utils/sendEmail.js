require('dotenv').config();

// Envío de correo vía API HTTPS de Resend (más confiable que SMTP desde hosts
// como Render, que a veces bloquean los puertos SMTP).
//
// Variables de entorno necesarias:
//   RESEND_API_KEY  -> API key de Resend (empieza con "re_")
//   EMAIL_FROM      -> remitente. El nombre visible puede ser "FERIM" aunque la
//                      dirección sea la de prueba: "FERIM <onboarding@resend.dev>".
//                      Con un dominio verificado en Resend: "FERIM <contacto@ferim.com>".
//                      (No se puede usar una dirección @gmail.com como remitente.)
//   EMAIL_REPLY_TO  -> (opcional) a dónde llegan las RESPUESTAS del usuario.
//                      Ej. ahora "a.ferney.torres@gmail.com"; luego "contacto@ferim.com".
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'FERIM <onboarding@resend.dev>';
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO;

const sendEmail = async (to, subject, html) => {
  if (!RESEND_API_KEY) {
    // Sin API key configurada: no enviamos (evita romper flujos como el registro).
    console.warn('RESEND_API_KEY no configurada; se omite el envío de correo.');
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      // Reply-To: las respuestas del usuario van a esta dirección (si está configurada)
      ...(EMAIL_REPLY_TO ? { reply_to: EMAIL_REPLY_TO } : {}),
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Resend respondió ${response.status}: ${errText}`);
  }

  const data = await response.json();
  console.log(`Correo enviado a ${to} (id: ${data.id})`);
  return data;
};

module.exports = sendEmail;
