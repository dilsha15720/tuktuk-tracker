import express from 'express';
import * as deviceController from '../controllers/device.controller.js';
import { authenticate, authorizeRoles } from '../utils/auth.js';
import { validate, createDeviceSchema, deviceActionSchema, objectIdParamsSchema } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = express.Router();
const adminOnly = [authenticate, authorizeRoles('HQ_ADMIN')];

router.post('/', ...adminOnly, validate(createDeviceSchema, 'body'), asyncHandler(deviceController.createDevice));
router.get('/', ...adminOnly, asyncHandler(deviceController.getDevices));
router.patch('/:id', ...adminOnly, validate(objectIdParamsSchema, 'params'), validate(deviceActionSchema, 'body'), asyncHandler(deviceController.updateDevice));

export default router;
