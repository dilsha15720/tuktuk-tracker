import request from 'supertest';
import app from '../server.js';
import setup from './setup.js';

let teardown;

beforeAll(async () => {
  teardown = await setup();
  process.env.ADMIN_USER = 'admin';
  process.env.ADMIN_PASS = 'admin123';
  process.env.JWT_SECRET = 'testsecret';
  process.env.REFRESH_TOKEN_SECRET = 'testrefreshsecret';
  process.env.OPERATOR_USER = 'operator';
  process.env.OPERATOR_PASS = 'operator123';
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
  expect(res.body.code).toBe('INVALID_REFRESH_TOKEN');
});

test('POST /api/auth/login rejects invalid creds', async () => {
  const res = await request(app).post('/api/auth/login').send({ username: 'wrong', password: 'no' });
  expect(res.statusCode).toBe(401);
});

test('HQ admin can create a user and the password is hashed', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ username: 'admin', password: 'admin123' });
  const res = await request(app)
    .post('/api/v1/auth/users')
    .set('Authorization', `Bearer ${login.body.accessToken}`)
    .send({ username: 'new.admin', password: 'SecurePassword123!', role: 'HQ_ADMIN' });

  expect(res.statusCode).toBe(201);
  expect(res.body.user.username).toBe('new.admin');
  expect(res.body.user.passwordHash).toBeUndefined();

  const createdLogin = await request(app).post('/api/v1/auth/login').send({ username: 'new.admin', password: 'SecurePassword123!' });
  expect(createdLogin.statusCode).toBe(200);
  expect(createdLogin.body.role).toBe('HQ_ADMIN');
});

test('user creation requires an HQ admin token', async () => {
  const res = await request(app).post('/api/v1/auth/users').send({
    username: 'blocked.user',
    password: 'SecurePassword123!',
    role: 'HQ_ADMIN'
  });
  expect(res.statusCode).toBe(401);

  const login = await request(app).post('/api/v1/auth/login').send({ username: 'operator', password: 'operator123' });
  const forbidden = await request(app)
    .post('/api/v1/auth/users')
    .set('Authorization', `Bearer ${login.body.accessToken}`)
    .send({ username: 'blocked.user', password: 'SecurePassword123!', role: 'HQ_ADMIN' });
  expect(forbidden.statusCode).toBe(403);
});

test('user creation rejects duplicate usernames', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ username: 'admin', password: 'admin123' });
  const payload = { username: 'duplicate.user', password: 'SecurePassword123!', role: 'HQ_ADMIN' };
  await request(app).post('/api/v1/auth/users').set('Authorization', `Bearer ${login.body.accessToken}`).send(payload);
  const duplicate = await request(app).post('/api/v1/auth/users')
    .set('Authorization', `Bearer ${login.body.accessToken}`)
    .send(payload);

  expect(duplicate.statusCode).toBe(409);
});

test('user creation requires the selected role jurisdiction', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ username: 'admin', password: 'admin123' });
  const res = await request(app)
    .post('/api/v1/auth/users')
    .set('Authorization', `Bearer ${login.body.accessToken}`)
    .send({ username: 'missing.scope', password: 'SecurePassword123!', role: 'STATION_OFFICER' });

  expect(res.statusCode).toBe(422);
});
