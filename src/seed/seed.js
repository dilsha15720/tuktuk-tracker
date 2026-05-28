import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import fs from 'fs';
import Route from '../models/route.model.js';
import Tuk from '../models/tuk.model.fixed.js';

dotenv.config();

async function seed() {
  await connectDB();
  const file = new URL('../../data/simulation-data.json', import.meta.url);
  const data = JSON.parse(fs.readFileSync(file));
  console.log('Seeding routes and buses...');

  for (const r of data.routes) {
    const existing = await Route.findOne({ routeCode: r.routeCode });
    if (!existing) await Route.create(r);
  }

  for (const b of data.buses) {
    const route = await Route.findOne({ routeCode: b.routeCode });
    const tukObj = {
      tukId: b.busId,
      registration: b.registration,
      route: route ? route._id : undefined,
      driverName: b.driverName,
      currentLocation: b.currentLocation,
      status: b.status,
      schedule: b.schedule
    };
    const existingTuk = await Tuk.findOne({ tukId: b.busId });
    if (!existingTuk) await Tuk.create(tukObj);
  }

  console.log('Seeding completed.');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
