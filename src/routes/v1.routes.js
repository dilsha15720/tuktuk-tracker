import express from 'express';
import authRoutes from './auth.routes.js';
import tukRoutes from './tuk.routes.clean.js';
import routeRoutes from './route.routes.js';
import locationRoutes from './location.routes.js';
import masterDataRoutes from './master-data.routes.js';
import historyRoutes from './history.routes.js';
import administrationRoutes from './administration.routes.js';
import deviceRoutes from './device.routes.js';
import { vehicleRoutes, driverRoutes } from './resource.routes.js';
import devicePingRoutes from './device-ping.routes.js';
import vehicleLocationRoutes from './vehicle-location.routes.js';

const router = express.Router();

router.get('/', (req, res) => res.json({
	name: 'Tuk Tracker API',
	version: 'v1',
	documentation: '/api-docs/',
	health: '/health',
	resources: {
		authentication: '/api/v1/auth',
		administration: '/api/v1/provinces',
		vehicles: '/api/v1/vehicles',
		drivers: '/api/v1/drivers',
		devices: '/api/v1/devices',
		tuks: '/api/v1/tuks',
		history: '/api/v1/history'
	}
}));

router.use('/auth', authRoutes);
router.use('/tuks', tukRoutes);
router.use('/routes', routeRoutes);
router.use('/locations', locationRoutes);
router.use('/master-data', masterDataRoutes);
router.use('/history', historyRoutes);
router.use('/devices', deviceRoutes);
router.use('/devices', devicePingRoutes);
router.use('/vehicles', vehicleLocationRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/drivers', driverRoutes);
router.use('/', administrationRoutes);

export default router;
