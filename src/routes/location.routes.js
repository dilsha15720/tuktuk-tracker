import express from 'express';
import Tuk from '../models/tuk.model.fixed.js';
import LocationPing from '../models/location-ping.model.js';
import { authMiddleware, requireRoles } from '../utils/auth.js';
import { validate, bulkLocationSchema } from '../middleware/validate.middleware.js';
const router = express.Router();

// Bulk update locations (expects [{ busId, latitude, longitude }])
router.post('/bulk-update', authMiddleware, requireRoles('HQ_ADMIN', 'STATION_OFFICER', 'DEVICE'), validate(bulkLocationSchema, 'body'), async (req, res) => {
  try {
    const updates = req.body;
    if (!Array.isArray(updates)) {
      return res.status(400).json({ message: 'Request body must be an array of location updates' });
    }
    const results = [];
    for (const u of updates) {
      const tuk = await Tuk.findOne({ tukId: u.busId || u.tukId || u.busId });
      const idKey = u.tukId || u.busId;
      if (!tuk) { results.push({ tukId: idKey, ok: false, reason: 'not found' }); continue; }
      if (!Number.isFinite(u.latitude) || !Number.isFinite(u.longitude)) {
        results.push({ tukId: idKey, ok: false, reason: 'latitude and longitude must be numbers' });
        continue;
      }
      const timestamp = new Date();
      tuk.currentLocation = { latitude: u.latitude, longitude: u.longitude, timestamp };
      await tuk.save();
      await LocationPing.create({
        tuk: tuk._id,
        location: { latitude: u.latitude, longitude: u.longitude },
        recordedAt: timestamp,
        source: 'device'
      });
      results.push({ tukId: idKey, ok: true });
    }
    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
