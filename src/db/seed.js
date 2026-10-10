import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Province from '../models/province.model.js';
import District from '../models/district.model.js';
import PoliceStation from '../models/police-station.model.js';
import User from '../models/user.model.js';
import Vehicle from '../models/vehicle.model.js';
import Driver from '../models/driver.model.js';
import Device from '../models/device.model.js';
import LocationPing from '../models/location-ping.model.js';
import VehicleLastLocation from '../models/vehicle-last-location.model.js';

dotenv.config();

const RESET = process.argv.includes('--reset');
const VEHICLE_COUNT = 220;
const PING_BATCH_SIZE = 5000;
const DAYS_OF_HISTORY = 7;
const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const DATA_DIR = path.join(ROOT, 'data');
const DEVICE_KEYS_FILE = path.join(ROOT, 'device-keys.json');

const provinces = [
  ['WP', 'Western', [['COL', 'Colombo'], ['GAM', 'Gampaha'], ['KAL', 'Kalutara']]],
  ['CP', 'Central', [['KAN', 'Kandy'], ['MAT', 'Matale'], ['NUE', 'Nuwara Eliya']]],
  ['SP', 'Southern', [['GAL', 'Galle'], ['GTR', 'Matara'], ['HAM', 'Hambantota']]],
  ['NP', 'Northern', [['JAF', 'Jaffna'], ['KIL', 'Kilinochchi'], ['MAN', 'Mannar'], ['MUL', 'Mullaitivu'], ['VAV', 'Vavuniya']]],
  ['EP', 'Eastern', [['BAT', 'Batticaloa'], ['AMP', 'Ampara'], ['TRI', 'Trincomalee']]],
  ['NWP', 'North Western', [['KUR', 'Kurunegala'], ['PUT', 'Puttalam']]],
  ['NCP', 'North Central', [['ANU', 'Anuradhapura'], ['POL', 'Polonnaruwa']]],
  ['UP', 'Uva', [['BAD', 'Badulla'], ['MON', 'Monaragala']]],
  ['SG', 'Sabaragamuwa', [['RAT', 'Ratnapura'], ['KEG', 'Kegalle']]]
];

const districtCenters = {
  COL: [6.9271, 79.8612], GAM: [7.0917, 80.0000], KAL: [6.5854, 79.9607],
  KAN: [7.2906, 80.6337], MAT: [7.4675, 80.6234], NUE: [6.9497, 80.7891],
  GAL: [6.0329, 80.2168], GTR: [5.9485, 80.5353], HAM: [6.1429, 81.1212],
  JAF: [9.6615, 80.0255], KIL: [9.3803, 80.3770], MAN: [8.9810, 79.9044],
  MUL: [9.2671, 80.8128], VAV: [8.7514, 80.4971], BAT: [7.7310, 81.6747],
  AMP: [7.2917, 81.6720], TRI: [8.5874, 81.2152], KUR: [7.4863, 80.3647],
  PUT: [8.0362, 79.8283], ANU: [8.3114, 80.4037], POL: [7.9403, 81.0188],
  BAD: [6.9934, 81.0550], MON: [6.8728, 81.3507], RAT: [6.6828, 80.3992],
  KEG: [7.2513, 80.3464]
};

const stationSeed = [
  ['PS001', 'Colombo Fort Police Station', 'COL'], ['PS002', 'Pettah Police Station', 'COL'],
  ['PS003', 'Gampaha Police Station', 'GAM'], ['PS004', 'Negombo Police Station', 'GAM'],
  ['PS005', 'Kandy Police Station', 'KAN'], ['PS006', 'Matale Police Station', 'MAT'],
  ['PS007', 'Galle Police Station', 'GAL'], ['PS008', 'Matara Police Station', 'GTR'],
  ['PS009', 'Jaffna Police Station', 'JAF'], ['PS010', 'Vavuniya Police Station', 'VAV'],
  ['PS011', 'Batticaloa Police Station', 'BAT'], ['PS012', 'Ampara Police Station', 'AMP'],
  ['PS013', 'Trincomalee Police Station', 'TRI'], ['PS014', 'Kurunegala Police Station', 'KUR'],
  ['PS015', 'Puttalam Police Station', 'PUT'], ['PS016', 'Anuradhapura Police Station', 'ANU'],
  ['PS017', 'Polonnaruwa Police Station', 'POL'], ['PS018', 'Badulla Police Station', 'BAD'],
  ['PS019', 'Ratnapura Police Station', 'RAT'], ['PS020', 'Kegalle Police Station', 'KEG']
];

/**
 * Insert a large collection in bounded batches to avoid oversized MongoDB writes.
 * @param {import('mongoose').Model} Model Mongoose model.
 * @param {object[]} documents Documents to insert.
 * @returns {Promise<void>} Completed batch insertion.
 */
async function insertBatches(Model, documents) {
  for (let index = 0; index < documents.length; index += PING_BATCH_SIZE) {
    await Model.insertMany(documents.slice(index, index + PING_BATCH_SIZE), { ordered: false });
  }
}

/**
 * Upsert a document by a stable seed key.
 * @param {import('mongoose').Model} Model Mongoose model.
 * @param {object} filter Stable lookup.
 * @param {object} update Seed values.
 * @returns {Promise<import('mongoose').Document>} Upserted document.
 */
function upsert(Model, filter, update) {
  return Model.findOneAndUpdate(filter, update, { new: true, upsert: true, setDefaultsOnInsert: true });
}

/**
 * Create deterministic master data for all Sri Lankan provinces and districts.
 * @returns {Promise<{provinces: object[], districts: object[], stations: object[]}>} Master data.
 */
async function seedMasterData() {
  const provinceDocs = new Map();
  const districtDocs = new Map();
  for (const [code, name, districtList] of provinces) {
    const province = await upsert(Province, { code }, { code, name });
    provinceDocs.set(code, province);
    for (const [districtCode, districtName] of districtList) {
      const district = await upsert(District, { code: districtCode }, { code: districtCode, name: districtName, province: province._id });
      districtDocs.set(districtCode, district);
    }
  }
  const stationDocs = [];
  for (const [stationCode, name, districtCode] of stationSeed) {
    const [latitude, longitude] = districtCenters[districtCode];
    stationDocs.push(await upsert(PoliceStation, { stationCode }, {
      stationCode,
      name,
      district: districtDocs.get(districtCode)._id,
      location: { latitude, longitude }
    }));
  }
  return { provinces: [...provinceDocs.values()], districts: [...districtDocs.values()], stations: stationDocs };
}

/**
 * Create demo users with bcrypt password hashes and jurisdiction claims.
 * @param {{provinces: object[], districts: object[], stations: object[]}} master Master data.
 * @returns {Promise<object[]>} Safe user documents.
 */
async function seedUsers(master) {
  const western = master.provinces.find((item) => item.code === 'WP');
  const colombo = master.districts.find((item) => item.code === 'COL');
  const station = master.stations[0];
  const users = [
    { username: 'hq.admin', role: 'HQ_ADMIN', password: 'CourseworkAdmin123!' },
    { username: 'western.officer', role: 'PROVINCIAL_OFFICER', provinceId: western._id, password: 'CourseworkProv123!' },
    { username: 'colombo.station', role: 'STATION_OFFICER', districtId: colombo._id, stationId: station._id, password: 'CourseworkStation123!' }
  ];
  const docs = [];
  for (const user of users) {
    const { password, ...safe } = user;
    docs.push(await upsert(User, { username: user.username }, { ...safe, passwordHash: await bcrypt.hash(password, 12), isActive: true }));
  }
  return docs.map((user) => user.toObject());
}

/**
 * Create drivers, vehicles, devices, and one-time device keys.
 * @param {{districts: object[], stations: object[]}} master Master data.
 * @returns {Promise<{drivers: object[], vehicles: object[], devices: object[], keys: object[]}>} Seeded resources.
 */
async function seedFleet(master) {
  const drivers = [];
  const vehicles = [];
  const devices = [];
  const keys = [];
  for (let index = 0; index < VEHICLE_COUNT; index += 1) {
    const station = master.stations[index % master.stations.length];
    const district = master.districts.find((item) => String(item._id) === String(station.district));
    const province = await Province.findById(district.province);
    const driver = await upsert(Driver, { licenceNumber: `SIM-LIC-${String(index + 1).padStart(4, '0')}` }, {
      fullName: `Simulated Driver ${index + 1}`,
      licenceNumber: `SIM-LIC-${String(index + 1).padStart(4, '0')}`,
      provinceId: province._id,
      districtId: district._id,
      stationId: station._id,
      isActive: true
    });
    const vehicle = await upsert(Vehicle, { plateNumber: `SIM-${String(index + 1).padStart(4, '0')}` }, {
      plateNumber: `SIM-${String(index + 1).padStart(4, '0')}`,
      provinceId: province._id,
      districtId: district._id,
      stationId: station._id,
      driverId: driver._id,
      status: 'ACTIVE'
    });
    const deviceCode = `SIM-DEVICE-${String(index + 1).padStart(4, '0')}`;
    const plainKey = `${deviceCode}.${crypto.randomBytes(32).toString('hex')}`;
    const device = await upsert(Device, { deviceCode }, {
      deviceCode,
      apiKeyHash: crypto.createHash('sha256').update(plainKey).digest('hex'),
      vehicleId: vehicle._id,
      isActive: true
    });
    await Vehicle.updateOne({ _id: vehicle._id }, { $set: { deviceId: device._id } });
    drivers.push(driver.toObject());
    vehicles.push(vehicle.toObject());
    devices.push({ ...device.toObject(), vehicleId: vehicle._id });
    keys.push({ deviceId: device._id, deviceCode, plainKey });
  }
  return { drivers, vehicles, devices, keys };
}

/**
 * Generate seven days of active-hours random-walk movement with peak speeds,
 * night inactivity, and deterministic cross-district anomalies.
 * @param {{vehicles: object[], devices: object[]}} fleet Seeded fleet.
 * @param {{districts: object[]}} master Master data.
 * @returns {Promise<{pings: object[], latest: object[]}>} Generated locations.
 */
async function seedMovement(fleet, master) {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const pings = [];
  const latest = new Map();
  for (let vehicleIndex = 0; vehicleIndex < fleet.vehicles.length; vehicleIndex += 1) {
    const vehicle = fleet.vehicles[vehicleIndex];
    const device = fleet.devices[vehicleIndex];
    const district = master.districts.find((item) => String(item._id) === String(vehicle.districtId));
    const home = districtCenters[district.code];
    const anomaly = vehicleIndex % 20 === 0;
    const anomalyDistrict = anomaly ? master.districts[(master.districts.indexOf(district) + 1) % master.districts.length] : district;
    const anomalyHome = districtCenters[anomalyDistrict.code];
    let latitude = home[0];
    let longitude = home[1];
    for (let day = DAYS_OF_HISTORY; day >= 1; day -= 1) {
      const start = new Date(today);
      start.setDate(start.getDate() - day);
      start.setHours(6, 0, 0, 0);
      const end = new Date(start);
      end.setHours(22, 0, 0, 0);
      for (let recordedAt = new Date(start); recordedAt < end;) {
        const hour = recordedAt.getHours();
        const peak = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
        const crossing = anomaly && day <= 3 && hour >= 12;
        const centre = crossing ? anomalyHome : home;
        const speed = peak ? 35 + Math.random() * 35 : 10 + Math.random() * 35;
        const radius = anomaly ? 0.04 : 0.018;
        latitude = centre[0] + (latitude - centre[0]) * 0.85 + (Math.random() - 0.5) * radius;
        longitude = centre[1] + (longitude - centre[1]) * 0.85 + (Math.random() - 0.5) * radius;
        const ping = {
          vehicleId: vehicle._id,
          deviceId: device._id,
          provinceId: crossing ? anomalyDistrict.province : vehicle.provinceId,
          districtId: crossing ? anomalyDistrict._id : vehicle.districtId,
          stationId: vehicle.stationId,
          location: { type: 'Point', coordinates: [longitude, latitude] },
          speed,
          heading: Math.floor(Math.random() * 360),
          recordedAt: new Date(recordedAt),
          source: 'simulation'
        };
        pings.push(ping);
        latest.set(String(vehicle._id), ping);
        recordedAt = new Date(recordedAt.getTime() + (2 + Math.floor(Math.random() * 4)) * 60 * 1000);
      }
    }
  }
  return { pings, latest: [...latest.values()] };
}

/**
 * Export redacted generated data for demonstrations and reports.
 * @param {object} data Generated seed data.
 * @returns {Promise<void>} Completed exports.
 */
async function exportData(data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const write = (name, value) => fs.writeFile(path.join(DATA_DIR, name), JSON.stringify(value, null, 2));
  await Promise.all([
    write('provinces.json', data.master.provinces),
    write('districts.json', data.master.districts),
    write('police-stations.json', data.master.stations),
    write('users.json', data.users),
    write('drivers.json', data.fleet.drivers),
    write('vehicles.json', data.fleet.vehicles),
    write('devices.json', data.fleet.devices.map(({ apiKeyHash, ...device }) => device)),
    write('location-pings.json', data.movement.pings)
  ]);
  await fs.writeFile(DEVICE_KEYS_FILE, JSON.stringify(data.fleet.keys, null, 2));
}

/**
 * Seed the full coursework dataset.
 * @returns {Promise<void>} Completed seed operation.
 */
export async function seed() {
  process.env.REQUIRE_MONGODB = 'true';
  await connectDB();
  if (RESET) {
    await Promise.all([Province.deleteMany({}), District.deleteMany({}), PoliceStation.deleteMany({}), User.deleteMany({}), Driver.deleteMany({}), Vehicle.deleteMany({}), Device.deleteMany({}), LocationPing.deleteMany({}), VehicleLastLocation.deleteMany({})]);
  } else if (await Vehicle.countDocuments() >= VEHICLE_COUNT && await LocationPing.countDocuments({ source: 'simulation' }) > 0) {
    console.log('Coursework dataset already exists; use --reset to regenerate it.');
    return;
  }
  const master = await seedMasterData();
  const users = await seedUsers(master);
  const fleet = await seedFleet(master);
  const movement = await seedMovement(fleet, master);
  await insertBatches(LocationPing, movement.pings);
  await VehicleLastLocation.deleteMany({});
  await insertBatches(VehicleLastLocation, movement.latest);
  await exportData({ master, users, fleet, movement });
  console.log(`Seeded ${master.provinces.length} provinces, ${master.districts.length} districts, ${master.stations.length} stations, ${fleet.vehicles.length} vehicles, and ${movement.pings.length} pings.`);
}

seed().catch(async (error) => {
  console.error('Coursework seed failed:', error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
