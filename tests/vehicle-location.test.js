import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app.js';
import setup from './setup.js';
import Vehicle from '../src/models/vehicle.model.js';
import LocationPing from '../src/models/location-ping.model.js';
import VehicleLastLocation from '../src/models/vehicle-last-location.model.js';
import AuditLog from '../src/models/audit-log.model.js';

let teardown;
let token;

beforeAll(async () => {
  teardown = await setup();
  process.env.ADMIN_USER = 'admin';
  process.env.ADMIN_PASS = 'admin123';
  process.env.JWT_SECRET = 'testsecret';
  const login = await request(app).post('/api/v1/auth/login').send({ username: 'admin', password: 'admin123' });
  token = login.body.accessToken;
});

afterAll(async () => {
  await teardown();
});

test('vehicle location endpoints return scoped last, history, live, and nearby data', async () => {
  const provinceId = new mongoose.Types.ObjectId();
  const districtId = new mongoose.Types.ObjectId();
  const stationId = new mongoose.Types.ObjectId();
  const deviceId = new mongoose.Types.ObjectId();
  const vehicle = await Vehicle.create({ plateNumber: 'WP-LOC-001', provinceId, districtId, stationId });
  const older = new Date(Date.now() - 2 * 60 * 1000);
  const newer = new Date(Date.now() - 60 * 1000);
  await LocationPing.create([
    { vehicleId: vehicle._id, deviceId, provinceId, districtId, stationId, location: { type: 'Point', coordinates: [79.8612, 6.9271] }, speed: 20, heading: 90, recordedAt: older },
    { vehicleId: vehicle._id, deviceId, provinceId, districtId, stationId, location: { type: 'Point', coordinates: [79.8622, 6.9281] }, speed: 25, heading: 100, recordedAt: newer }
  ]);
  await VehicleLastLocation.create({ vehicleId: vehicle._id, deviceId, provinceId, districtId, stationId, location: { type: 'Point', coordinates: [79.8622, 6.9281] }, speed: 25, heading: 100, recordedAt: newer });

  const last = await request(app).get(`/api/v1/vehicles/${vehicle._id}/location`).set('Authorization', `Bearer ${token}`);
  expect(last.statusCode).toBe(200);
  expect(last.body.location.coordinates).toEqual([79.8622, 6.9281]);
  expect(last.headers.etag).toBeDefined();
  expect(last.headers['last-modified']).toBeDefined();
  const cachedLast = await request(app).get(`/api/v1/vehicles/${vehicle._id}/location`)
    .set('Authorization', `Bearer ${token}`)
    .set('If-None-Match', last.headers.etag);
  expect(cachedLast.statusCode).toBe(304);

  const history = await request(app).get(`/api/v1/vehicles/${vehicle._id}/locations?from=${new Date(Date.now() - 5 * 60 * 1000).toISOString()}&to=${new Date().toISOString()}`).set('Authorization', `Bearer ${token}`);
  expect(history.statusCode).toBe(200);
  expect(history.body.data).toHaveLength(2);
  expect(new Date(history.body.data[0].recordedAt).getTime()).toBeLessThan(new Date(history.body.data[1].recordedAt).getTime());
  const audit = await AuditLog.findOne({ action: 'HISTORY_ACCESS' }).lean();
  expect(audit.actorUsername).toBe('admin');
  expect(audit.metadata.endpoint).toContain(`/api/v1/vehicles/${vehicle._id}/locations`);
  expect(audit.ipAddress).toBeDefined();

  const tooWide = await request(app).get(`/api/v1/vehicles/${vehicle._id}/locations?from=2020-01-01T00:00:00.000Z&to=2020-01-09T00:00:00.000Z`).set('Authorization', `Bearer ${token}`);
  expect(tooWide.statusCode).toBe(422);

  const live = await request(app).get(`/api/v1/vehicles/locations/live?province=${provinceId}`).set('Authorization', `Bearer ${token}`);
  expect(live.statusCode).toBe(200);
  expect(live.body.data).toHaveLength(1);
  const cachedLive = await request(app).get(`/api/v1/vehicles/locations/live?province=${provinceId}`)
    .set('Authorization', `Bearer ${token}`)
    .set('If-None-Match', live.headers.etag);
  expect(cachedLive.statusCode).toBe(304);

  const nearby = await request(app).get('/api/v1/vehicles/locations/nearby?lat=6.9271&lng=79.8612&radius=1').set('Authorization', `Bearer ${token}`);
  expect(nearby.statusCode).toBe(200);
  expect(nearby.body.data).toHaveLength(1);
});
