const Chat = require('../models/Chat');

// --- Utilidades de normalización para el match tolerante ---
// Quita acentos descomponiendo (NFD) y eliminando las marcas diacríticas
// combinantes por código de carácter (0x300–0x36f). Hecho con codePointAt en
// vez de regex Unicode para evitar problemas de codificación del archivo.
function normalize(s) {
  const lowered = String(s || '').toLowerCase().normalize('NFD');
  let out = '';
  for (const ch of lowered) {
    const code = ch.codePointAt(0);
    if (code >= 0x300 && code <= 0x36f) continue; // marca diacrítica -> se omite
    out += ch;
  }
  return out
    .replace(/[^a-z0-9\s]/g, ' ') // quitar puntuación (ñ ya quedó como n)
    .replace(/\s+/g, ' ')
    .trim();
}

const STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'en', 'y', 'o',
  'a', 'que', 'como', 'cual', 'cuales', 'para', 'por', 'con', 'mi', 'tu', 'es', 'son',
  'se', 'al', 'lo', 'me', 'te', 'su', 'sus', 'hay', 'puedo', 'quiero', 'donde', 'cuando',
]);

function tokens(s) {
  return normalize(s).split(' ').filter((w) => w && !STOPWORDS.has(w));
}

// Añadir un par pregunta/respuesta: POST /api/chats/add
exports.addChat = async (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ msg: 'Pregunta y respuesta son obligatorias' });
    }
    const newChat = new Chat({ question: String(question).trim(), answer: String(answer).trim() });
    await newChat.save();
    res.status(201).json(newChat);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'Error al guardar la pregunta' });
  }
};

// Listar todos los pares: GET /api/chats
exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find().sort({ createdAt: -1 });
    res.status(200).json(chats);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'Error al obtener las preguntas' });
  }
};

// Eliminar un par: DELETE /api/chats/:id
exports.deleteChat = async (req, res) => {
  try {
    const deleted = await Chat.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: 'Pregunta no encontrada' });
    res.json({ msg: 'Pregunta eliminada' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'Error al eliminar la pregunta' });
  }
};

// Responder una consulta con match tolerante: POST /api/chats/ask
// Devuelve { matched, answer?, question?, score? }. Si no hay match, matched=false
// y el frontend (NILA) usa su fallback de respuestas inteligentes.
exports.askChat = async (req, res) => {
  try {
    const { query } = req.body;
    const q = normalize(query);
    if (!q) return res.json({ matched: false });

    const chats = await Chat.find();

    // 1) Coincidencia exacta normalizada
    const exact = chats.find((c) => normalize(c.question) === q);
    if (exact) {
      return res.json({ matched: true, answer: exact.answer, question: exact.question, score: 1 });
    }

    // 2) Solapamiento de palabras clave. Se prioriza el MAYOR número de palabras
    //    compartidas (evita que preguntas muy cortas/genéricas ganen) y se
    //    desempata por la proporción cubierta de la pregunta guardada.
    const qTokens = new Set(tokens(query));
    let best = null;
    let bestShared = 0;
    let bestScore = 0;
    for (const c of chats) {
      const cTokens = tokens(c.question);
      if (!cTokens.length) continue;
      const shared = cTokens.filter((w) => qTokens.has(w)).length;
      if (shared === 0) continue;
      const score = shared / cTokens.length;
      if (shared > bestShared || (shared === bestShared && score > bestScore)) {
        best = c;
        bestShared = shared;
        bestScore = score;
      }
    }

    // Aceptar si comparte al menos 2 palabras clave, o si comparte 1 que cubre
    // buena parte (>=60%) de la pregunta guardada.
    if (best && (bestShared >= 2 || bestScore >= 0.6)) {
      return res.json({ matched: true, answer: best.answer, question: best.question, score: bestScore });
    }

    return res.json({ matched: false });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ matched: false, msg: 'Error al procesar la consulta' });
  }
};
