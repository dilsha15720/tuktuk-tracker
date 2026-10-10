import mongoose from 'mongoose';

const policeStationSchema = new mongoose.Schema({
  stationCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  district: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
  location: {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 }
  }
}, { timestamps: true });

policeStationSchema.index({ district: 1, name: 1 });

export default mongoose.model('PoliceStation', policeStationSchema);
