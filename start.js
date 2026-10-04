import app from './server.js';
import connectDB from './src/config/db.js';

const PORT = process.env.PORT || 5000;

(async function() {
  // attempt DB connection but don't crash the process if it fails
  if (process.env.NODE_ENV !== 'test') {
    await connectDB();
  }

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();
