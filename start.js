import { startServer } from './server.js';

startServer().catch((error) => {
  console.error('Startup failed:', error.message);
  process.exit(1);
});
