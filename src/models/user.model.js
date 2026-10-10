import mongoose from 'mongoose';

/**
 * User accounts represent human law-enforcement users. Password hashes are
 * explicitly excluded from normal queries and JSON serialization.
 */
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: ['HQ_ADMIN', 'PROVINCIAL_OFFICER', 'STATION_OFFICER'],
    required: true
  },
  provinceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Province' },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'PoliceStation' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: { transform: (_doc, value) => { delete value.passwordHash; return value; } },
  toObject: { transform: (_doc, value) => { delete value.passwordHash; return value; } }
});

userSchema.index({ role: 1, provinceId: 1, districtId: 1, stationId: 1 });

export default mongoose.model('User', userSchema);
