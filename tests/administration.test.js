import request from 'supertest';
import app from '../app.js';
import setup from './setup.js';
import Province from '../src/models/province.model.js';
import District from '../src/models/district.model.js';
import PoliceStation from '../src/models/police-station.model.js';

let teardown;

beforeAll(async () => {
  teardown = await setup();
  await Province.create({ code: 'ZZZ', name: 'Second Province' });
  const province = await Province.create({ code: 'ADM', name: 'Administration Province' });
  const district = await District.create({ code: 'ADM', name: 'Administration District', province: province._id });
  await PoliceStation.create({ stationCode: 'ADM001', name: 'Administration Station', district: district._id });
});

afterAll(async () => {
  await teardown();
});

test('GET /api/v1/provinces returns pagination metadata and Link header', async () => {
  const response = await request(app).get('/api/v1/provinces?page=1&limit=1');
  expect(response.statusCode).toBe(200);
  expect(response.body.pagination.limit).toBe(1);
  expect(response.headers.link).toContain('rel="next"');
  expect(response.body.data).toHaveLength(1);
});

test('nested administration routes return lean district and station data', async () => {
  const province = await Province.findOne({ code: 'ADM' }).lean();
  const districts = await request(app).get(`/api/v1/provinces/${province._id}/districts`);
  expect(districts.statusCode).toBe(200);
  expect(districts.body.data[0].code).toBe('ADM');

  const district = await District.findOne({ code: 'ADM' }).lean();
  const stations = await request(app).get(`/api/v1/districts/${district._id}/police-stations`);
  expect(stations.statusCode).toBe(200);
  expect(stations.body.data[0].stationCode).toBe('ADM001');
});
