import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app.js';
import setup from './setup.js';

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
