import Tuk from '../models/tuk.model.js';

export const getAllTuks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.route) filter.route = req.query.route;
    const tuks = await Tuk.find(filter).populate('route').sort({ tukId: 1 });
    res.json(tuks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTukById = async (req, res) => {
  try {
    const tuk = await Tuk.findById(req.params.id).populate('route');
    if (!tuk) return res.status(404).json({ message: 'Tuk not found' });
    res.json(tuk);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTukLocation = async (req, res) => {
  try {
    const tuk = await Tuk.findById(req.params.id);
    if (!tuk) return res.status(404).json({ message: 'Tuk not found' });
    res.json(tuk.currentLocation || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createTuk = async (req, res) => {
  try {
    const tuk = new Tuk(req.body);
    await tuk.save();
    res.status(201).json(tuk);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateTuk = async (req, res) => {
  try {
    const tuk = await Tuk.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('route');
    if (!tuk) return res.status(404).json({ message: 'Tuk not found' });
    res.json(tuk);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteTuk = async (req, res) => {
  try {
    const tuk = await Tuk.findByIdAndDelete(req.params.id);
    if (!tuk) return res.status(404).json({ message: 'Tuk not found' });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateTukLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ message: 'latitude and longitude must be numbers' });
    }
    const tuk = await Tuk.findById(req.params.id);
    if (!tuk) return res.status(404).json({ message: 'Tuk not found' });
    tuk.currentLocation = { latitude, longitude, timestamp: new Date() };
    await tuk.save();
    res.json({ message: 'Location updated', currentLocation: tuk.currentLocation });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
 