import express from 'express';
import * as routeController from '../controllers/route.controller.js';
import { authMiddleware, requireRoles } from '../utils/auth.js';
const router = express.Router();

router.get('/', routeController.getAllRoutes);
router.get('/:id', routeController.getRouteById);
router.post('/', authMiddleware, requireRoles('admin'), routeController.createRoute);

export default router;
