import Tuk from '../models/tuk.model.js';
import LocationPing from '../models/location-ping.model.js';
import { jurisdictionFilter } from '../utils/jurisdiction.js';
import { getTukStatistics } from '../services/tuk.service.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getAllTuks = async (req, res) => {
  try {
    const filter = { ...jurisdictionFilter(req.user) };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.route) filter.route = req.query.route;
    if (req.query.province) filter.province = req.query.province;
    if (req.query.district) filter.district = req.query.district;
    if (req.query.policeStation) filter.policeStation = req.query.policeStation;
    if (req.query.search) {
      const search = escapeRegex(req.query.search);
      filter.$or = [
        { tukId: new RegExp(search, 'i') },
        { registration: new RegExp(search, 'i') },
        { driverName: new RegExp(search, 'i') }
      ];
    }
    const sortFields = new Set(['tukId', 'registration', 'status', 'createdAt']);
    const requestedSort = String(req.query.sort || 'tukId');
    const sortField = requestedSort.replace(/^-/, '');
    const sort = sortFields.has(sortField) ? requestedSort : 'tukId';
    const query = Tuk.find(filter)
      .populate('route province district policeStation')
      .sort(sort);
    if (!req.query.page && !req.query.limit) return res.json(await query);
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 25, 1), 100);
    const [tuks, total] = await Promise.all([
      query.skip((page - 1) * limit).limit(limit),
      Tuk.countDocuments(filter)
    ]);
    res.json({ data: tuks, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTukStats = async (req, res) => {
  try {
    const scope = jurisdictionFilter(req.user);
    res.json(await getTukStatistics(scope));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTukById = async (req, res) => {
  try {
    const tuk = await Tuk.findOne({ _id: req.params.id, ...jurisdictionFilter(req.user) }).populate('route province district policeStation');
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
    const tuk = await Tuk.findOne({ _id: req.params.id, ...jurisdictionFilter(req.user) }).select('tukId registration');
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
 