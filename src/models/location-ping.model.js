import mongoose from 'mongoose';

const locationPingSchema = new mongoose.Schema({
  tuk: { type: mongoose.Schema.Types.ObjectId, ref: 'Tuk', required: true, index: true },
  location: {
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 }
  },
  recordedAt: { type: Date, required: true, index: true },
  speedKph: { type: Number, min: 0, max: 200 },
  source: { type: String, enum: ['device', 'simulation'], default: 'device' }
}, { timestamps: true });

locationPingSchema.index({ tuk: 1, recordedAt: -1 });

export default mongoose.model('LocationPing', locationPingSchema);
