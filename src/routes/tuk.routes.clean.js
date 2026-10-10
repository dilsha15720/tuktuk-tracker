import express from 'express';
import * as tukController from '../controllers/tuk.controller.fixed.js';
import { authMiddleware, requireRoles } from '../utils/auth.js';
import { validate, paginationSchema, locationSchema, createTukSchema, updateTukSchema } from '../middleware/validate.middleware.js';

const router = express.Router();

router.get('/', validate(paginationSchema, 'query'), tukController.getAllTuks);
router.get('/stats', tukController.getTukStats);
router.get('/:id', tukController.getTukById);
router.get('/:id/location', tukController.getTukLocation);
router.get('/:id/history', tukController.getTukHistory);
router.post('/', authMiddleware, requireRoles('HQ_ADMIN', 'PROVINCIAL_OFFICER'), validate(createTukSchema, 'body'), tukController.createTuk);
router.patch('/:id', authMiddleware, requireRoles('HQ_ADMIN', 'PROVINCIAL_OFFICER'), validate(updateTukSchema, 'body'), tukController.updateTuk);
router.delete('/:id', authMiddleware, requireRoles('HQ_ADMIN'), tukController.deleteTuk);
router.post('/:id/location', authMiddleware, requireRoles('HQ_ADMIN', 'STATION_OFFICER', 'DEVICE'), validate(locationSchema, 'body'), tukController.updateTukLocation);

export default router;
