import express from 'express';
import * as tukController from '../controllers/tuk.controller.fixed.js';
import { authMiddleware, requireRoles } from '../utils/auth.js';

const router = express.Router();

router.get('/', tukController.getAllTuks);
router.get('/stats', tukController.getTukStats);
router.get('/:id', tukController.getTukById);
router.get('/:id/location', tukController.getTukLocation);
router.get('/:id/history', tukController.getTukHistory);
router.post('/', authMiddleware, requireRoles('admin'), tukController.createTuk);
router.patch('/:id', authMiddleware, requireRoles('admin'), tukController.updateTuk);
router.delete('/:id', authMiddleware, requireRoles('admin'), tukController.deleteTuk);
router.post('/:id/location', authMiddleware, requireRoles('admin', 'operator'), tukController.updateTukLocation);

export default router;
