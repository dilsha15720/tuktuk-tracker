import express from 'express';
import * as administrationController from '../controllers/administration.controller.js';
import { validate, administrationQuerySchema, objectIdParamsSchema } from '../middleware/validate.middleware.js';

const router = express.Router();

router.get('/provinces', validate(administrationQuerySchema, 'query'), administrationController.getProvinces);
router.get('/provinces/:id/districts', validate(objectIdParamsSchema, 'params'), validate(administrationQuerySchema, 'query'), administrationController.getProvinceDistricts);
router.get('/districts', validate(administrationQuerySchema, 'query'), administrationController.getDistricts);
router.get('/districts/:id/police-stations', validate(objectIdParamsSchema, 'params'), validate(administrationQuerySchema, 'query'), administrationController.getDistrictPoliceStations);

export default router;
