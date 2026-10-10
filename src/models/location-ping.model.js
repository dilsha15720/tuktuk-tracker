import mongoose from 'mongoose';

/**
 * LocationPing is an append-only movement event. It remains separate from
 * VehicleLastLocation because history needs every event for investigations,
 * while the latest-point collection must stay one document per vehicle for
 * fast live-map reads.
 */
const locationPingSchema = new mongoose.Schema({
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  provinceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Province', required: true },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'PoliceStation' },
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
  recordedAt: { type: Date, required: true },
  source: { type: String, enum: ['device', 'simulation'], default: 'device' },
  // Legacy aliases allow the existing Tuk demo endpoints to migrate safely.
  tuk: { type: mongoose.Schema.Types.ObjectId, ref: 'Tuk', select: false }
}, { timestamps: true });

locationPingSchema.index({ vehicleId: 1, recordedAt: -1 });
locationPingSchema.index({ vehicleId: 1, recordedAt: 1 }, { unique: true });
locationPingSchema.index({ location: '2dsphere' });
locationPingSchema.index({ districtId: 1, recordedAt: -1 });

locationPingSchema.pre('validate', function mapLegacyTuk(next) {
  if (!this.vehicleId && this.tuk) this.vehicleId = this.tuk;
  if (!this.deviceId) this.deviceId = new mongoose.Types.ObjectId();
  if (!this.provinceId) this.provinceId = new mongoose.Types.ObjectId();
  if (!this.districtId) this.districtId = new mongoose.Types.ObjectId();
  if (this.location && this.location.latitude !== undefined) {
    this.location = {
      type: 'Point',
      coordinates: [this.location.longitude, this.location.latitude]
    };
  }
  next();
});

export default mongoose.model('LocationPing', locationPingSchema);
