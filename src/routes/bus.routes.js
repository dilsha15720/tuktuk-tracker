import express from 'express';
import * as busController from '../controllers/bus.controller.js';
import { authMiddleware } from '../utils/auth.js';
const router = express.Router();

router.get('/', busController.getAllBuses);
router.get('/:id', busController.getBusById);
router.get('/:id/location', busController.getBusLocation);
router.post('/', authMiddleware, busController.createBus);
router.post('/:id/location', authMiddleware, busController.updateBusLocation);

export default router;
