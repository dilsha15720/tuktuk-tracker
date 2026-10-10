import express from 'express';
import * as deviceController from '../controllers/device.controller.js';
import { authenticate, authorizeRoles } from '../utils/auth.js';
import { validate, createDeviceSchema, deviceActionSchema, objectIdParamsSchema } from '../middleware/validate.middleware.js';

const router = express.Router();
const adminOnly = [authenticate, authorizeRoles('HQ_ADMIN')];

router.post('/', ...adminOnly, validate(createDeviceSchema, 'body'), deviceController.createDevice);
router.get('/', ...adminOnly, deviceController.getDevices);
router.patch('/:id', ...adminOnly, validate(objectIdParamsSchema, 'params'), validate(deviceActionSchema, 'body'), deviceController.updateDevice);

export default router;
