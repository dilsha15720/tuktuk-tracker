import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import fs from 'fs';
import mongoose from 'mongoose';
import Route from '../models/route.model.js';
import Tuk from '../models/tuk.model.js';
import Province from '../models/province.model.js';
import District from '../models/district.model.js';
import PoliceStation from '../models/police-station.model.js';
import LocationPing from '../models/location-ping.model.js';

dotenv.config();

const provinceData = [
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

const stationData = [
  ['PS001', 'Colombo Fort Police Station', 'COL', 6.9344, 79.8428],
  ['PS002', 'Pettah Police Station', 'COL', 6.9366, 79.8497],
  ['PS003', 'Gampaha Police Station', 'GAM', 7.0917, 80.0000],
  ['PS004', 'Negombo Police Station', 'GAM', 7.2083, 79.8358],
  ['PS005', 'Kandy Police Station', 'KAN', 7.2906, 80.6337],
  ['PS006', 'Matale Police Station', 'MAT', 7.4675, 80.6234],
  ['PS007', 'Galle Police Station', 'GAL', 6.0329, 80.2168],
  ['PS008', 'Matara Police Station', 'GTR', 5.9485, 80.5353],
  ['PS009', 'Jaffna Police Station', 'JAF', 9.6615, 80.0255],
  ['PS010', 'Vavuniya Police Station', 'VAV', 8.7514, 80.4971],
  ['PS011', 'Batticaloa Police Station', 'BAT', 7.7310, 81.6747],
  ['PS012', 'Ampara Police Station', 'AMP', 7.2917, 81.6720],
  ['PS013', 'Trincomalee Police Station', 'TRI', 8.5874, 81.2152],
  ['PS014', 'Kurunegala Police Station', 'KUR', 7.4863, 80.3647],
  ['PS015', 'Puttalam Police Station', 'PUT', 8.0362, 79.8283],
  ['PS016', 'Anuradhapura Police Station', 'ANU', 8.3114, 80.4037],
  ['PS017', 'Polonnaruwa Police Station', 'POL', 7.9403, 81.0188],
  ['PS018', 'Badulla Police Station', 'BAD', 6.9934, 81.0550],
  ['PS019', 'Ratnapura Police Station', 'RAT', 6.6828, 80.3992],
  ['PS020', 'Kegalle Police Station', 'KEG', 7.2513, 80.3464]
];

const upsert = (Model, filter, update) => Model.findOneAndUpdate(filter, update, {
  new: true,
  upsert: true,
  setDefaultsOnInsert: true
});

async function seed() {
  process.env.REQUIRE_MONGODB = 'true';
  await connectDB();

  const provinces = new Map();
  const districts = new Map();
  for (const [provinceCode, provinceName, districtData] of provinceData) {
    const province = await upsert(Province, { code: provinceCode }, { code: provinceCode, name: provinceName });
    provinces.set(provinceCode, province);
    for (const [districtCode, districtName] of districtData) {
      const district = await upsert(District, { code: districtCode }, {
        code: districtCode,
        name: districtName,
        province: province._id
      });
      districts.set(districtCode, district);
    }
  }

  const stations = [];
  for (const [stationCode, name, districtCode, latitude, longitude] of stationData) {
    stations.push(await upsert(PoliceStation, { stationCode }, {
      stationCode,
      name,
      district: districts.get(districtCode)._id,
      location: { latitude, longitude }
    }));
  }

  const file = new URL('../../data/simulation-data.json', import.meta.url);
  const simulationData = JSON.parse(fs.readFileSync(file));
  const routes = [];
  for (const routeData of simulationData.routes) {
    routes.push(await upsert(Route, { routeCode: routeData.routeCode }, routeData));
  }

  const tuks = [];
  for (let index = 0; index < 200; index += 1) {
    const station = stations[index % stations.length];
    const district = await District.findById(station.district);
    const province = await Province.findById(district.province);
    const tuk = await upsert(Tuk, { tukId: `TUK${String(index + 1).padStart(3, '0')}` }, {
      tukId: `TUK${String(index + 1).padStart(3, '0')}`,
      registration: `WP-TK-${String(index + 1).padStart(3, '3')}`,
      deviceId: `GPS-SIM-${String(index + 1).padStart(3, '0')}`,
      route: routes[index % routes.length]._id,
      province: province._id,
      district: district._id,
      policeStation: station._id,
      driverName: `Simulated Driver ${index + 1}`,
      status: ['On Route', 'Stopped', 'Delayed'][index % 3],
      currentLocation: {
        latitude: station.location.latitude,
        longitude: station.location.longitude,
        timestamp: new Date()
      }
    });
    tuks.push(tuk);
  }

  await LocationPing.deleteMany({ source: 'simulation' });
  const simulationDate = new Date(process.env.SIMULATION_DATE || Date.now());
  const pings = [];
  for (let day = 7; day >= 1; day -= 1) {
    for (let interval = 0; interval < 4; interval += 1) {
      for (let index = 0; index < tuks.length; index += 1) {
        const recordedAt = new Date(simulationDate);
        recordedAt.setDate(recordedAt.getDate() - day);
        recordedAt.setHours(6 + interval * 4, 0, 0, 0);
        pings.push({
          tuk: tuks[index]._id,
          location: {
            latitude: 6.0 + ((index * 0.013 + interval * 0.002) % 3.5),
            longitude: 79.5 + ((index * 0.017 + day * 0.003) % 3.0)
          },
          recordedAt,
          speedKph: 15 + ((index + interval) % 35),
          source: 'simulation'
        });
      }
    }
  }
  for (let index = 0; index < pings.length; index += 1000) {
    await LocationPing.insertMany(pings.slice(index, index + 1000));
  }

  console.log(`Seed completed: ${provinces.size} provinces, ${districts.size} districts, ${stations.length} stations, ${tuks.length} tuks, ${pings.length} location pings.`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error('Seed failed:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
