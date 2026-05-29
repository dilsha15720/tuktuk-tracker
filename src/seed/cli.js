#!/usr/bin/env node
import connectDB from '../config/db.js';
import { runSeed } from './seed.js';

(async () => {
  try {
    await connectDB();
    await runSeed();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
