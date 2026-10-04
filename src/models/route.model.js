import mongoose from 'mongoose';

const RouteSchema = new mongoose.Schema({
  routeCode: { type: String, required: true, unique: true },
  name: String,
  origin: String,
  destination: String,
  stops: [String],
  distanceKm: Number
});

export default mongoose.model('Route', RouteSchema);
