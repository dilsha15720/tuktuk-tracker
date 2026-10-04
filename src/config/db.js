import mongoose from 'mongoose';

let _inMemoryServer = null;

const connectDB = async () => {
  // If a real URI is provided and doesn't contain a placeholder, try it first
  const uri = process.env.MONGODB_URI || '';
  if (uri && !uri.includes('<db_password>')) {
    try {
      const conn = await mongoose.connect(uri, {});
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return true;
    } catch (error) {
      console.error('MongoDB connection error:', error.message);
      console.warn('Failed to connect to configured MongoDB. Will attempt an in-memory MongoDB for demo/testing.');
    }
  } else if (!uri) {
    console.warn('MONGODB_URI not set — will attempt an in-memory MongoDB for demo/testing.');
  } else {
    console.warn('MONGODB_URI contains placeholder or is invalid — will attempt an in-memory MongoDB for demo/testing.');
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
    console.warn('Continuing without DB connection (degraded mode).');
    return false;
  }
};

// Optional helper to stop the in-memory server when the process exits
const stopInMemoryServer = async () => {
  try {
    if (_inMemoryServer) await _inMemoryServer.stop();
  } catch (err) {
    /* ignore */
  }
};

process.on('exit', () => { stopInMemoryServer(); });

export default connectDB;
