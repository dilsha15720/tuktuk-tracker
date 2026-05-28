import app from './server.js';
import connectDB from './src/config/db.js';

const PORT = process.env.PORT || 5000;

(async function() {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();
