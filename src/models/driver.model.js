import mongoose from 'mongoose';

/** Driver identity is separate from a Vehicle because drivers can change vehicles. */
const driverSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  licenceNumber: { type: String, required: true, unique: true, trim: true },
  phoneNumber: { type: String, trim: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Driver', driverSchema);
