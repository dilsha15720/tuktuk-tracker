import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import fs from 'fs';
import Route from '../models/route.model.js';
import Tuk from '../models/tuk.model.js';

dotenv.config();

async function seed() {
  process.env.REQUIRE_MONGODB = 'true';
  const connected = await connectDB();
  if (!connected) {
    throw new Error('A persistent MongoDB connection is required for seeding.');
  }
  const file = new URL('../../data/simulation-data.json', import.meta.url);
  const data = JSON.parse(fs.readFileSync(file));
  let routesAdded = 0;
  let tuksAdded = 0;
  console.log('Seeding routes and tuks...');

  for (const r of data.routes) {
    const existing = await Route.findOne({ routeCode: r.routeCode });
    if (!existing) {
      await Route.create(r);
      routesAdded += 1;
    }
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
    if (!existingTuk) {
      await Tuk.create(tukObj);
      tuksAdded += 1;
    }
  }

  console.log(`Seeding completed: ${routesAdded} routes and ${tuksAdded} tuks added.`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
