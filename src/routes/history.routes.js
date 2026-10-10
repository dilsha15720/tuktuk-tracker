import express from 'express';
import LocationPing from '../models/location-ping.model.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.tukId) filter.tuk = req.query.tukId;
    if (req.query.from || req.query.to) {
      filter.recordedAt = {};
      if (req.query.from) filter.recordedAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.recordedAt.$lte = new Date(req.query.to);
    }
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 1000);
    const points = await LocationPing.find(filter)
      .populate('tuk', 'tukId registration')
      .sort({ recordedAt: -1 })
      .limit(limit);
    res.json({ count: points.length, points });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
