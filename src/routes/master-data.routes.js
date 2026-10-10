import express from 'express';
import * as masterDataController from '../controllers/master-data.controller.js';

const router = express.Router();

router.get('/provinces', masterDataController.getProvinces);
router.get('/districts', masterDataController.getDistricts);
router.get('/stations', masterDataController.getPoliceStations);

export default router;
