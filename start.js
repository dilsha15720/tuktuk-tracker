import app from './server.js';
import connectDB from './src/config/db.js';

const PORT = process.env.PORT || 5000;

(async function() {
  // attempt DB connection but don't crash the process if it fails
  if (process.env.NODE_ENV !== 'test') {
    await connectDB();

    // Optional: run seeding on start for local dev when requested
    if (process.env.SEED_ON_START === 'true') {
      try {
        const { runSeed } = await import('./src/seed/seed.js');
        console.log('SEED_ON_START=true; running seed...');
        await runSeed();
        console.log('Seed finished.');
      } catch (err) {
        console.warn('Seed-on-start failed:', err && err.message ? err.message : err);
      }
    }
  }

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();
