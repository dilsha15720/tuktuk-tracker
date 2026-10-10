import mongoose from 'mongoose';

/**
 * Stores one current point per vehicle for fast live-map reads. Historical
 * points remain in LocationPing, avoiding expensive scans of the event log.
 */
const vehicleLastLocationSchema = new mongoose.Schema({
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true, unique: true },
  provinceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Province', required: true },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'PoliceStation' },
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point', required: true },
    coordinates: {
      type: [Number],
      required: true,
      validate: { validator: (value) => value.length === 2 && value[0] >= -180 && value[0] <= 180 && value[1] >= -90 && value[1] <= 90, message: 'coordinates must be [longitude, latitude]' }
    }
  },
  speed: { type: Number, min: 0, max: 200 },
  heading: { type: Number, min: 0, max: 360 },
  recordedAt: { type: Date, required: true }
}, { timestamps: true });

vehicleLastLocationSchema.index({ location: '2dsphere' });

export default mongoose.model('VehicleLastLocation', vehicleLastLocationSchema);
