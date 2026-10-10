import Bus from '../models/bus.model.js';

/** List buses. @param {import('express').Request} req Request. @param {import('express').Response} res Response. @returns {Promise<void>} Response promise. */
export const getAllBuses = async (req, res) => {
  try {
    const buses = await Bus.find().populate('route');
    res.json(buses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Get one bus. @param {import('express').Request} req Request. @param {import('express').Response} res Response. @returns {Promise<void>} Response promise. */
export const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id).populate('route');
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json(bus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Get bus location. @param {import('express').Request} req Request. @param {import('express').Response} res Response. @returns {Promise<void>} Response promise. */
export const getBusLocation = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json(bus.currentLocation || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Create a bus. @param {import('express').Request} req Request. @param {import('express').Response} res Response. @returns {Promise<void>} Response promise. */
export const createBus = async (req, res) => {
  try {
    const bus = new Bus(req.body);
    await bus.save();
    res.status(201).json(bus);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/** Update a bus location. @param {import('express').Request} req Request. @param {import('express').Response} res Response. @returns {Promise<void>} Response promise. */
export const updateBusLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    bus.currentLocation = { latitude, longitude, timestamp: new Date() };
    await bus.save();
    res.json({ message: 'Location updated', currentLocation: bus.currentLocation });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
