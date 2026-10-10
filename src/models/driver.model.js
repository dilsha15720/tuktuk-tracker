import mongoose from 'mongoose';

/** Driver identity is separate from a Vehicle because drivers can change vehicles. */
const driverSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  licenceNumber: { type: String, required: true, unique: true, trim: true },
  phoneNumber: { type: String, trim: true },
  provinceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Province' },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'PoliceStation' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

driverSchema.index({ provinceId: 1, districtId: 1, stationId: 1 });

export default mongoose.model('Driver', driverSchema);
