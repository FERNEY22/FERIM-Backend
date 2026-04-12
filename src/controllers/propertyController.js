const Property = require('../models/Property');
const User = require('../models/User');

exports.createProperty = async (req, res) => {
  try {
    const { title, description, price, type, location, images } = req.body;
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });
    if (user.role !== 'propietario') return res.status(403).json({ msg: 'Acceso denegado. Solo propietarios pueden registrar propiedades.' });
    const property = await new Property({ title, description, price, type, location, images: images || [], owner: user.id }).save();
    res.status(201).json(property);
  } catch (err) { console.error(err.message); res.status(500).send('Error en el servidor'); }
};

exports.getAllProperties = async (req, res) => {
  try {
    const properties = await Property.find().populate('owner', 'name lastname email').sort({ createdAt: -1 });
    res.json(properties);
  } catch (err) { console.error(err.message); res.status(500).send('Error en el servidor'); }
};

exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('owner', 'name lastname email');
    if (!property) return res.status(404).json({ msg: 'Propiedad no encontrada' });
    res.json(property);
  } catch (err) { console.error(err.message); res.status(500).send('Error en el servidor'); }
};

exports.getMyProperties = async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(properties);
  } catch (err) { console.error(err.message); res.status(500).send('Error en el servidor'); }
};

exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ msg: 'Propiedad no encontrada' });
    if (property.owner.toString() !== req.user.id) return res.status(403).json({ msg: 'No autorizado' });
    const updated = await Property.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(updated);
  } catch (err) { console.error(err.message); res.status(500).send('Error en el servidor'); }
};

exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ msg: 'Propiedad no encontrada' });
    if (property.owner.toString() !== req.user.id) return res.status(403).json({ msg: 'No autorizado' });
    await Property.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Propiedad eliminada' });
  } catch (err) { console.error(err.message); res.status(500).send('Error en el servidor'); }
};