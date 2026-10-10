import express from 'express';
import authRoutes from './auth.routes.js';
import tukRoutes from './tuk.routes.clean.js';
import routeRoutes from './route.routes.js';
import locationRoutes from './location.routes.js';
import masterDataRoutes from './master-data.routes.js';
import historyRoutes from './history.routes.js';
import administrationRoutes from './administration.routes.js';
import deviceRoutes from './device.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/tuks', tukRoutes);
router.use('/routes', routeRoutes);
router.use('/locations', locationRoutes);
router.use('/master-data', masterDataRoutes);
router.use('/history', historyRoutes);
router.use('/devices', deviceRoutes);
router.use('/', administrationRoutes);

export default router;
