import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
// Use the cleaned router implementation (fallback) until the corrupted tuk.routes.js is removed
import tukRoutes from './src/routes/tuk.routes.clean.js';
import routeRoutes from './src/routes/route.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import locationRoutes from './src/routes/location.routes.js';
import masterDataRoutes from './src/routes/master-data.routes.js';
import historyRoutes from './src/routes/history.routes.js';

dotenv.config();
const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use(express.json({ limit: '100kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/tuks', tukRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/history', historyRoutes);

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
