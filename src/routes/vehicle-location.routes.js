import express from 'express';
import { authenticate, authorizeRoles } from '../utils/auth.js';
import { validate, objectIdParamsSchema, vehicleHistoryQuerySchema, liveLocationQuerySchema, nearbyLocationQuerySchema } from '../middleware/validate.middleware.js';
import * as vehicleLocationController from '../controllers/vehicle-location.controller.js';

const router = express.Router();
const roles = [authenticate, authorizeRoles('HQ_ADMIN', 'PROVINCIAL_OFFICER', 'STATION_OFFICER')];

router.get('/locations/live', ...roles, validate(liveLocationQuerySchema, 'query', 422), vehicleLocationController.getLive);
router.get('/locations/nearby', ...roles, validate(nearbyLocationQuerySchema, 'query', 422), vehicleLocationController.getNearby);
router.get('/:id/location', ...roles, validate(objectIdParamsSchema, 'params', 422), vehicleLocationController.getLastLocation);
router.get('/:id/locations', ...roles, validate(objectIdParamsSchema, 'params', 422), validate(vehicleHistoryQuerySchema, 'query', 422), vehicleLocationController.getHistory);

export default router;