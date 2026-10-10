import Tuk from '../models/tuk.model.js';

/** List Tuks. @param {import('express').Request} req Request. @param {import('express').Response} res Response. @returns {Promise<void>} Response promise. */
export const getAllTuks = async (req, res) => {
  try {
    const tuks = await Tuk.find().populate('route');
    res.json(tuks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Get one Tuk. @param {import('express').Request} req Request. @param {import('express').Response} res Response. @returns {Promise<void>} Response promise. */
export const getTukById = async (req, res) => {
  try {
    const tuk = await Tuk.findById(req.params.id).populate('route');
    if (!tuk) return res.status(404).json({ message: 'Tuk not found' });
    res.json(tuk);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Get Tuk location. @param {import('express').Request} req Request. @param {import('express').Response} res Response. @returns {Promise<void>} Response promise. */
export const getTukLocation = async (req, res) => {
  try {
    const tuk = await Tuk.findById(req.params.id);
    if (!tuk) return res.status(404).json({ message: 'Tuk not found' });
    res.json(tuk.currentLocation || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Create a Tuk. @param {import('express').Request} req Request. @param {import('express').Response} res Response. @returns {Promise<void>} Response promise. */
export const createTuk = async (req, res) => {
  try {
    const tuk = new Tuk(req.body);
    await tuk.save();
    res.status(201).json(tuk);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/** Update Tuk location. @param {import('express').Request} req Request. @param {import('express').Response} res Response. @returns {Promise<void>} Response promise. */
export const updateTukLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const tuk = await Tuk.findById(req.params.id);
    if (!tuk) return res.status(404).json({ message: 'Tuk not found' });
    tuk.currentLocation = { latitude, longitude, timestamp: new Date() };
    await tuk.save();
    res.json({ message: 'Location updated', currentLocation: tuk.currentLocation });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

