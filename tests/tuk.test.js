import request from 'supertest';
import app from '../server.js';
import setup from './setup.js';
import Tuk from '../src/models/tuk.model.js';
import Province from '../src/models/province.model.js';
import District from '../src/models/district.model.js';
import PoliceStation from '../src/models/police-station.model.js';

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
  const province = await Province.create({ code: 'TST', name: 'Test Province' });
  const district = await District.create({ code: 'TST', name: 'Test District', province: province._id });
  const station = await PoliceStation.create({
    stationCode: 'TST001',
    name: 'Test Station',
    district: district._id,
    location: { latitude: 6.9, longitude: 79.8 }
  });
  const res = await request(app).post('/api/tuks').set('Authorization', `Bearer ${token}`).send({
    tukId: 'T001',
    registration: 'REG1',
    deviceId: 'DEVICE001',
    province: province._id,
    district: district._id,
    policeStation: station._id
  });
  expect(res.statusCode).toBe(201);
  expect(res.body.tukId).toBe('T001');

  const location = await request(app)
    .post(`/api/tuks/${res.body._id}/location`)
    .set('Authorization', `Bearer ${token}`)
    .send({ latitude: 6.9271, longitude: 79.8612 });
  expect(location.statusCode).toBe(200);

  const history = await request(app).get(`/api/tuks/${res.body._id}/history`);
  expect(history.statusCode).toBe(200);
  expect(history.body.count).toBe(1);

  const list = await request(app).get('/api/tuks');
  expect(list.body.length).toBe(1);
});
