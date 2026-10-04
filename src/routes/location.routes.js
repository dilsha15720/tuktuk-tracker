import express from 'express';
import Tuk from '../models/tuk.model.fixed.js';
import { authMiddleware } from '../utils/auth.js';
const router = express.Router();

// Bulk update locations (expects [{ busId, latitude, longitude }])
router.post('/bulk-update', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    const results = [];
    for (const u of updates) {
      const tuk = await Tuk.findOne({ tukId: u.busId || u.tukId || u.busId });
      const idKey = u.tukId || u.busId;
      if (!tuk) { results.push({ tukId: idKey, ok: false, reason: 'not found' }); continue; }
      tuk.currentLocation = { latitude: u.latitude, longitude: u.longitude, timestamp: new Date() };
      await tuk.save();
      results.push({ tukId: idKey, ok: true });
    }
    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
