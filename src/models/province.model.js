import mongoose from 'mongoose';

const provinceSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, unique: true, trim: true }
}, { timestamps: true });

export default mongoose.model('Province', provinceSchema);
