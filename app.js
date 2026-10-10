import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import v1Routes from './src/routes/v1.routes.js';
import { sanitizeInput } from './src/middleware/sanitize.middleware.js';
import { errorHandler, notFoundHandler } from './src/middleware/error.middleware.js';
import { normalizeErrorResponses } from './src/middleware/error-response.middleware.js';

dotenv.config();

const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  }
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use(express.json({ limit: '100kb' }));
app.use(sanitizeInput());
app.use(normalizeErrorResponses());

app.use('/api/v1', v1Routes);
// Compatibility aliases for existing coursework demo scripts; new clients use /api/v1.
app.use('/api', v1Routes);

app.get('/', (req, res) => res.send('Tuk Tracker API'));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

if (process.env.NODE_ENV !== 'test') {
  try {
    const openapiUrl = new URL('./src/docs/openapi.yaml', import.meta.url).pathname;
    const openapiDocument = YAML.load(openapiUrl);
    openapiDocument.servers = [{ url: process.env.PUBLIC_URL || '/' }];
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
  } catch (error) {
    console.warn('Could not load OpenAPI docs:', error.message);
  }
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
