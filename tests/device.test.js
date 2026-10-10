import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app.js';
import setup from './setup.js';
import Vehicle from '../src/models/vehicle.model.js';
import VehicleLastLocation from '../src/models/vehicle-last-location.model.js';

let teardown;

beforeAll(async () => {
  teardown = await setup();
  process.env.ADMIN_USER = 'admin';
  process.env.ADMIN_PASS = 'admin123';
  process.env.JWT_SECRET = 'testsecret';
});

afterAll(async () => {
  await teardown();
});

test('admin can create, list, rotate, and revoke a device key', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ username: 'admin', password: 'admin123' });
  const create = await request(app)
    .post('/api/v1/devices')
    .set('Authorization', `Bearer ${login.body.accessToken}`)
    .send({ vehicleId: new mongoose.Types.ObjectId().toString(), deviceCode: 'TEST-DEVICE' });

  expect(create.statusCode).toBe(201);
  expect(create.body.plainKey).toContain('TEST-DEVICE.');
  expect(create.body.device.apiKeyHash).toBeUndefined();

  const list = await request(app).get('/api/v1/devices').set('Authorization', `Bearer ${login.body.accessToken}`);
  expect(list.statusCode).toBe(200);
  expect(list.body.data[0].apiKeyHash).toBeUndefined();

  const rotate = await request(app)
    .patch(`/api/v1/devices/${create.body.device._id}`)
    .set('Authorization', `Bearer ${login.body.accessToken}`)
    .send({ action: 'rotate' });
  expect(rotate.statusCode).toBe(200);
  expect(rotate.body.plainKey).toContain('TEST-DEVICE.');

  const revoke = await request(app)
    .patch(`/api/v1/devices/${create.body.device._id}`)
    .set('Authorization', `Bearer ${login.body.accessToken}`)
    .send({ action: 'revoke' });
  expect(revoke.statusCode).toBe(200);
  expect(revoke.body.device.apiKeyHash).toBeUndefined();
});

test('device key records pings and skips duplicate timestamps in a batch', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ username: 'admin', password: 'admin123' });
  const vehicle = await Vehicle.create({
    plateNumber: 'WP-PING-001',
    provinceId: new mongoose.Types.ObjectId(),
    districtId: new mongoose.Types.ObjectId(),
    stationId: new mongoose.Types.ObjectId()
  });
  const device = await request(app)
    .post('/api/v1/devices')
    .set('Authorization', `Bearer ${login.body.accessToken}`)
    .send({ vehicleId: vehicle._id.toString(), deviceCode: 'PING-DEVICE' });
  const recordedAt = new Date(Date.now() - 1000).toISOString();
  const ping = { latitude: 6.9271, longitude: 79.8612, speed: 30, heading: 90, recordedAt };

  const single = await request(app)
    .post(`/api/v1/devices/${device.body.device._id}/pings`)
    .set('X-Device-Key', device.body.plainKey)
    .send(ping);
  expect(single.statusCode).toBe(201);
  expect(single.body.accepted).toBe(1);

  const batch = await request(app)
    .post(`/api/v1/devices/${device.body.device._id}/pings/batch`)
    .set('X-Device-Key', device.body.plainKey)
    .send([ping, { ...ping, recordedAt: new Date(Date.now() - 2000).toISOString() }]);
  expect(batch.statusCode).toBe(201);
  expect(batch.body.duplicates).toBe(1);
  expect(batch.body.accepted).toBe(1);

  const latest = await VehicleLastLocation.findOne({ vehicleId: vehicle._id }).lean();
  expect(latest.location.coordinates).toEqual([79.8612, 6.9271]);
});

test('invalid device keys return 401', async () => {
  const response = await request(app)
    .post(`/api/v1/devices/${new mongoose.Types.ObjectId()}/pings`)
    .set('X-Device-Key', 'UNKNOWN-DEVICE.invalid-key')
    .send({ latitude: 6.9, longitude: 79.8, speed: 10, heading: 90, recordedAt: new Date().toISOString() });
  expect(response.statusCode).toBe(401);
  expect(response.body.code).toBe('INVALID_DEVICE_KEY');
});
