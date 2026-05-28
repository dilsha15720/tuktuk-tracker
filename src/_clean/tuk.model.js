import mongoose from 'mongoose';

const TukSchema = new mongoose.Schema({
  tukId: { type: String, required: true, unique: true },
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

const TukModel = mongoose.models.Tuk || mongoose.model('Tuk', TukSchema);
export default TukModel;
