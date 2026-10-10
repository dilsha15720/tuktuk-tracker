import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app.js';
import setup from './setup.js';

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

test('vehicle CRUD validates, sets Location, detects duplicate plates, and supports selection', async () => {
  const input = {
    plateNumber: 'WP-TEST-001',
    provinceId: new mongoose.Types.ObjectId().toString(),
    districtId: new mongoose.Types.ObjectId().toString(),
    stationId: new mongoose.Types.ObjectId().toString(),
    status: 'ACTIVE'
  };
  const create = await request(app).post('/api/v1/vehicles').set('Authorization', `Bearer ${token}`).send(input);
  expect(create.statusCode).toBe(201);
  expect(create.headers.location).toMatch(/\/api\/v1\/vehicles\/.+/);

  const duplicate = await request(app).post('/api/v1/vehicles').set('Authorization', `Bearer ${token}`).send(input);
  expect(duplicate.statusCode).toBe(409);

  const list = await request(app).get('/api/v1/vehicles?plate=WP-TEST&fields=plateNumber,status').set('Authorization', `Bearer ${token}`);
  expect(list.statusCode).toBe(200);
  expect(list.body.data[0].plateNumber).toBe('WP-TEST-001');
  expect(list.body.data[0].provinceId).toBeUndefined();

  const update = await request(app).patch(`/api/v1/vehicles/${create.body._id}`).set('Authorization', `Bearer ${token}`).send({ status: 'SUSPENDED' });
  expect(update.statusCode).toBe(200);
  expect(update.body.status).toBe('SUSPENDED');

  const deleted = await request(app).delete(`/api/v1/vehicles/${create.body._id}`).set('Authorization', `Bearer ${token}`);
  expect(deleted.statusCode).toBe(204);
});

test('protected resources reject missing tokens, invalid IDs, and NoSQL operator keys', async () => {
  const missing = await request(app).get('/api/v1/vehicles');
  expect(missing.statusCode).toBe(401);
  expect(missing.body.code).toBe('AUTH_REQUIRED');

  const invalidId = await request(app).get('/api/v1/vehicles/not-an-object-id').set('Authorization', `Bearer ${token}`);
  expect(invalidId.statusCode).toBe(400);
  expect(invalidId.body.code).toBe('VALIDATION_ERROR');

  const injection = await request(app).post('/api/v1/vehicles').set('Authorization', `Bearer ${token}`).send({
    '$where': 'this.status === "ACTIVE"',
    plateNumber: 'UNSAFE',
    provinceId: new mongoose.Types.ObjectId().toString(),
    districtId: new mongoose.Types.ObjectId().toString(),
    stationId: new mongoose.Types.ObjectId().toString()
  });
  expect(injection.statusCode).toBe(400);
  expect(injection.body.code).toBe('UNSAFE_INPUT');
});

test('driver create and invalid vehicle input return expected statuses', async () => {
  const invalid = await request(app).post('/api/v1/vehicles').set('Authorization', `Bearer ${token}`).send({ plateNumber: 'INVALID' });
  expect(invalid.statusCode).toBe(422);

  const create = await request(app).post('/api/v1/drivers').set('Authorization', `Bearer ${token}`).send({
    fullName: 'Test Driver',
    licenceNumber: 'LIC-TEST-001'
  });
  expect(create.statusCode).toBe(201);
  expect(create.headers.location).toMatch(/\/api\/v1\/drivers\/.+/);
});
