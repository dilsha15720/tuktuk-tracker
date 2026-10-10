import mongoose from 'mongoose';

/**
 * Vehicle is the registered three-wheeler identity used by operational APIs.
 * Jurisdiction IDs are denormalized to make scoped queries index-friendly.
 */
const vehicleSchema = new mongoose.Schema({
  plateNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  provinceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Province', required: true },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'PoliceStation', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], default: 'ACTIVE' }
}, { timestamps: true });

vehicleSchema.index({ provinceId: 1, districtId: 1, stationId: 1 });

export default mongoose.model('Vehicle', vehicleSchema);
