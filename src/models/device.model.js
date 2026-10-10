import mongoose from 'mongoose';

/** Device credentials are stored as a one-way hash; the raw API key is never persisted. */
const deviceSchema = new mongoose.Schema({
  deviceCode: { type: String, required: true, unique: true, trim: true },
  apiKeyHash: { type: String, required: true, select: false },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  lastSeenAt: Date,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Device', deviceSchema);
