import express from 'express';
import * as routeController from '../controllers/route.controller.js';
import { authMiddleware, requireRoles } from '../utils/auth.js';
import { validate, routeSchema } from '../middleware/validate.middleware.js';
const router = express.Router();

router.get('/', routeController.getAllRoutes);
router.get('/:id', routeController.getRouteById);
router.post('/', authMiddleware, requireRoles('HQ_ADMIN', 'PROVINCIAL_OFFICER'), validate(routeSchema, 'body'), routeController.createRoute);

export default router;
