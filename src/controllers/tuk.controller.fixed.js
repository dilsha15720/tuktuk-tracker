import Tuk from '../models/tuk.model.js';
import LocationPing from '../models/location-ping.model.js';

export const getAllTuks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.route) filter.route = req.query.route;
    const tuks = await Tuk.find(filter)
      .populate('route province district policeStation')
      .sort({ tukId: 1 });
    res.json(tuks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTukById = async (req, res) => {
  try {
    const tuk = await Tuk.findById(req.params.id).populate('route province district policeStation');
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

export const getTukHistory = async (req, res) => {
  try {
    const tuk = await Tuk.findById(req.params.id).select('tukId registration');
    if (!tuk) return res.status(404).json({ message: 'Tuk not found' });
    const filter = { tuk: tuk._id };
    if (req.query.from || req.query.to) {
      filter.recordedAt = {};
      if (req.query.from) filter.recordedAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.recordedAt.$lte = new Date(req.query.to);
    }
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 1000);
    const points = await LocationPing.find(filter).sort({ recordedAt: -1 }).limit(limit);
    res.json({ tuk, count: points.length, points });
  } catch (err) {
    res.status(400).json({ message: err.message });
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
    await LocationPing.create({
      tuk: tuk._id,
      location: { latitude, longitude },
      recordedAt: tuk.currentLocation.timestamp,
      source: 'device'
    });
    res.json({ message: 'Location updated', currentLocation: tuk.currentLocation });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
 