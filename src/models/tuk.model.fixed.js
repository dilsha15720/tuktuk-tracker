import mongoose from 'mongoose';

const TukSchema = new mongoose.Schema({
  tukId: { type: String, required: true, unique: true },
  registration: { type: String, required: true, trim: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  driverName: { type: String, trim: true },
  currentLocation: {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    timestamp: Date
  },
  status: { type: String, enum: ['On Route', 'Stopped', 'Delayed'], default: 'On Route' },
  schedule: [
    {
      tripDate: Date,
      departureTime: String,
      arrivalTime: String
    }
  ]
}, { timestamps: true });

export default mongoose.model('Tuk', TukSchema);
