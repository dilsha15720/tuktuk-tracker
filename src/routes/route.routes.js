import express from 'express';
import * as routeController from '../controllers/route.controller.js';
import { authMiddleware } from '../utils/auth.js';
const router = express.Router();

router.get('/', routeController.getAllRoutes);
router.post('/', authMiddleware, routeController.createRoute);

export default router;
