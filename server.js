import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
// Use the cleaned router implementation (fallback) until the corrupted tuk.routes.js is removed
import tukRoutes from './src/routes/tuk.routes.clean.js';
import routeRoutes from './src/routes/route.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import locationRoutes from './src/routes/location.routes.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tuks', tukRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/locations', locationRoutes);

app.get('/', (req, res) => res.send('Tuk Tracker API'));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Swagger UI (skip during tests to avoid parsing errors in CI/test env)
if (process.env.NODE_ENV !== 'test') {
	try {
		// Resolve docs path relative to this file so loading works regardless of CWD
		// (use import.meta.url to compute a stable absolute path)
		// eslint-disable-next-line no-undef
		const openapiUrl = new URL('./docs/openapi.yaml', import.meta.url).pathname;
		const openapiDocument = YAML.load(openapiUrl);
		openapiDocument.servers = [{ url: process.env.PUBLIC_URL || '/' }];
		app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
	} catch (err) {
		// log and continue - avoid throwing during app import
		// (useful if docs/openapi.yaml is being edited)
		// eslint-disable-next-line no-console
		console.warn('Could not load OpenAPI docs:', err.message);
	}
}

export default app;
