import express from 'express';
import { authenticateDevice } from '../middleware/device-auth.middleware.js';
import { validate, deviceIdParamsSchema, pingSchema, pingBatchSchema } from '../middleware/validate.middleware.js';
import * as devicePingController from '../controllers/device-ping.controller.js';

const router = express.Router();

router.post('/:deviceId/pings', validate(deviceIdParamsSchema, 'params', 422), authenticateDevice, validate(pingSchema, 'body', 422), devicePingController.createPing);
router.post('/:deviceId/pings/batch', validate(deviceIdParamsSchema, 'params', 422), authenticateDevice, validate(pingBatchSchema, 'body', 422), devicePingController.createPingBatch);

export default router;
