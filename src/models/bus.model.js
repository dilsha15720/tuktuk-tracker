import mongoose from 'mongoose';

const BusSchema = new mongoose.Schema({
  busId: { type: String, required: true, unique: true },
  registration: String,
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  driverName: String,
  currentLocation: {
    latitude: Number,
    longitude: Number,
    timestamp: Date
  },
  status: { type: String, enum: ['On Route','Stopped','Delayed'], default: 'On Route' },
  schedule: [{
    tripDate: Date,
    departureTime: String,
    arrivalTime: String
  }]
});

export default mongoose.model('Bus', BusSchema);
