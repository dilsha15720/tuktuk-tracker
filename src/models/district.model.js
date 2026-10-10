import mongoose from 'mongoose';

const districtSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  province: { type: mongoose.Schema.Types.ObjectId, ref: 'Province', required: true }
}, { timestamps: true });

districtSchema.index({ province: 1, name: 1 });

export default mongoose.model('District', districtSchema);
