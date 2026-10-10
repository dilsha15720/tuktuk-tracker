import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app.js';
import setup from './setup.js';
import User from '../src/models/user.model.js';
import Vehicle from '../src/models/vehicle.model.js';
import VehicleLastLocation from '../src/models/vehicle-last-location.model.js';

let teardown;

beforeAll(async () => {
  teardown = await setup();
  const stationId = new mongoose.Types.ObjectId();
  const districtId = new mongoose.Types.ObjectId();
  await User.create({
    username: 'station.scope',
    passwordHash: await bcrypt.hash('station-password', 10),
    role: 'STATION_OFFICER',
    stationId,
    districtId
  });
  const visibleVehicle = await Vehicle.create({
    plateNumber: 'SCOPE-VISIBLE',
    provinceId: new mongoose.Types.ObjectId(),
    districtId,
    stationId
  });
  const hiddenVehicle = await Vehicle.create({
    plateNumber: 'SCOPE-HIDDEN',
    provinceId: new mongoose.Types.ObjectId(),
    districtId: new mongoose.Types.ObjectId(),
    stationId: new mongoose.Types.ObjectId()
  });
  await VehicleLastLocation.create([
    {
      vehicleId: visibleVehicle._id,
      provinceId: visibleVehicle.provinceId,
      districtId,
      stationId,
      deviceId: new mongoose.Types.ObjectId(),
      location: { type: 'Point', coordinates: [79.8612, 6.9271] },
      recordedAt: new Date()
    },
    {
      vehicleId: hiddenVehicle._id,
      provinceId: hiddenVehicle.provinceId,
      districtId: hiddenVehicle.districtId,
      deviceId: new mongoose.Types.ObjectId(),
      location: { type: 'Point', coordinates: [80.0, 7.0] },
      recordedAt: new Date()
    }
  ]);
});

afterAll(async () => {
  await teardown();
});

test('station officer live view is limited to its station jurisdiction', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ username: 'station.scope', password: 'station-password' });
  expect(login.statusCode).toBe(200);
  const response = await request(app).get('/api/v1/vehicles/locations/live').set('Authorization', `Bearer ${login.body.accessToken}`);
  expect(response.statusCode).toBe(200);
  expect(response.body.data).toHaveLength(1);
  expect(response.body.data[0].vehicleId.toString()).toBeDefined();
});
