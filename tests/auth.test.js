import request from 'supertest';
import app from '../server.js';
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

test('POST /api/auth/login returns token for valid creds', async () => {
  const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'admin123' });
  expect(res.statusCode).toBe(200);
  expect(res.body.token).toBeDefined();
  expect(res.body.accessToken).toBeDefined();
  expect(res.body.refreshToken).toBeDefined();
});

test('POST /api/v1/auth/refresh rotates a valid refresh token', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ username: 'admin', password: 'admin123' });
  const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: login.body.refreshToken });
  expect(res.statusCode).toBe(200);
  expect(res.body.accessToken).toBeDefined();
  expect(res.body.refreshToken).toBeDefined();
});

test('POST /api/v1/auth/refresh rejects an invalid refresh token', async () => {
  const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: 'invalid' });
  expect(res.statusCode).toBe(401);
  expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
});

test('POST /api/auth/login rejects invalid creds', async () => {
  const res = await request(app).post('/api/auth/login').send({ username: 'wrong', password: 'no' });
  expect(res.statusCode).toBe(401);
});
