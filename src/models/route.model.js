import mongoose from 'mongoose';

const RouteSchema = new mongoose.Schema({
  routeCode: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  origin: { type: String, required: true, trim: true },
  destination: { type: String, required: true, trim: true },
  stops: [String],
  distanceKm: { type: Number, min: 0 }
}, { timestamps: true });

export default mongoose.model('Route', RouteSchema);
