import { fileURLToPath } from 'node:url';
import app from './app.js';
import connectDB from './src/config/db.js';

const PORT = Number(process.env.PORT) || 5000;
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

/**
 * Connect to MongoDB before starting the HTTP server.
 * @returns {Promise<import('node:http').Server>} Running HTTP server.
 */
export async function startServer() {
  await connectDB();
  const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  return server;
}

if (isMainModule && process.env.NODE_ENV !== 'test') {
  startServer().catch((error) => {
    console.error('Startup failed:', error.message);
    process.exit(1);
  });
}

export default app;
