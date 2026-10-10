import mongoose from 'mongoose';

let _inMemoryServer = null;

/** Connect to configured MongoDB or the local test fallback. @returns {Promise<boolean>} Connection result. */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || '';
  const requireMongoDB = process.env.NODE_ENV === 'production' || process.env.REQUIRE_MONGODB === 'true';

  if (!uri || uri.includes('<db_password>')) {
    if (requireMongoDB) {
      throw new Error('MONGODB_URI must be configured with a reachable MongoDB deployment.');
    }
    console.warn('MONGODB_URI is not configured; using an in-memory database for local development.');
  } else {
    try {
      const conn = await mongoose.connect(uri);
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return true;
    } catch (error) {
      console.error('MongoDB connection error:', error.message);
      if (requireMongoDB) throw error;
      console.warn('Using an in-memory database for local development.');
    }
  }

  // Attempt to start an in-memory MongoDB (mongodb-memory-server)
  try {
    // dynamic import so production environments without the package won't break
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    _inMemoryServer = await MongoMemoryServer.create();
    const memUri = _inMemoryServer.getUri();
    const conn = await mongoose.connect(memUri, {});
    console.log('Connected to in-memory MongoDB for demo/testing.');
    // expose for potential shutdown
    return true;
  } catch (err) {
    console.error('Failed to start in-memory MongoDB:', err && err.message ? err.message : err);
    if (requireMongoDB) throw err;
    console.warn('Continuing without a database connection.');
    return false;
  }
};

// Optional helper to stop the in-memory server when the process exits
/** Stop the optional in-memory MongoDB server. @returns {Promise<void>} Stop promise. */
const stopInMemoryServer = async () => {
  try {
    if (_inMemoryServer) await _inMemoryServer.stop();
  } catch (err) {
    /* ignore */
  }
};

process.on('exit', () => { stopInMemoryServer(); });

export default connectDB;
