import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Province from '../src/models/province.model.js';
import District from '../src/models/district.model.js';
import PoliceStation from '../src/models/police-station.model.js';
import Tuk from '../src/models/tuk.model.js';
import LocationPing from '../src/models/location-ping.model.js';

dotenv.config();

const required = {
  provinces: 9,
  districts: 25,
  stations: 20,
  tuks: 200,
  simulationPings: 5600
};

try {
  process.env.REQUIRE_MONGODB = 'true';
  await connectDB();
  const counts = {
    provinces: await Province.countDocuments(),
    districts: await District.countDocuments(),
    stations: await PoliceStation.countDocuments(),
    tuks: await Tuk.countDocuments(),
    simulationPings: await LocationPing.countDocuments({ source: 'simulation' })
  };
  console.table(counts);
  const passed = Object.entries(required).every(([key, minimum]) => counts[key] >= minimum);
  if (!passed) throw new Error('Simulation data does not meet the coursework minimums. Run npm run seed.');
  console.log('Simulation validation passed.');
} catch (error) {
  console.error(`Simulation validation failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
