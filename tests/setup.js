import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Increase Jest timeout so MongoMemoryServer has enough time to download/start
// when running in CI or constrained environments.
try {
  // jest is available in the test environment
  jest.setTimeout(30000);
} catch (e) {
  // ignore if jest is not defined
}

let mongo;

export default async function setup() {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  return async function teardown() {
    await mongoose.disconnect();
    await mongo.stop();
  };
}
