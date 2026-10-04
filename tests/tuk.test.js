import request from 'supertest';
import app from '../server.js';
import setup from './setup.js';
import Tuk from '../src/models/tuk.model.js';

let teardown;

beforeAll(async () => {
  teardown = await setup();
});

afterAll(async () => {
  await teardown();
});

test('GET /api/tuks returns empty array initially', async () => {
  const res = await request(app).get('/api/tuks');
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBe(0);
});

test('POST /api/tuks creates tuk when authed', async () => {
  // create token
  process.env.JWT_SECRET = 'testsecret';
  process.env.ADMIN_USER = 'admin';
  process.env.ADMIN_PASS = 'admin123';

  const login = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'admin123' });
  const token = login.body.token;
  const res = await request(app).post('/api/tuks').set('Authorization', `Bearer ${token}`).send({ tukId: 'T001', registration: 'REG1' });
  expect(res.statusCode).toBe(201);
  expect(res.body.tukId).toBe('T001');

  const list = await request(app).get('/api/tuks');
  expect(list.body.length).toBe(1);
});
