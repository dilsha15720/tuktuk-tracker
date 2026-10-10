import express from 'express';
import { resourceController } from '../controllers/resource.controller.js';
import { authenticate, authorizeRoles } from '../utils/auth.js';
import { validate, objectIdParamsSchema, resourceQuerySchema, vehicleSchema, vehicleUpdateSchema, driverSchema, driverUpdateSchema } from '../middleware/validate.middleware.js';

/**
 * Create CRUD routes for a scoped resource.
 * @param {'vehicles'|'drivers'} resource Resource name.
 * @param {import('joi').ObjectSchema} createSchema Create schema.
 * @param {import('joi').ObjectSchema} updateSchema Update schema.
 * @returns {import('express').Router} Configured router.
 */
export function createResourceRoutes(resource, createSchema, updateSchema) {
  const router = express.Router();
  const controller = resourceController(resource);
  const roles = [authenticate, authorizeRoles('HQ_ADMIN', 'PROVINCIAL_OFFICER', 'STATION_OFFICER')];
  router.get('/', ...roles, validate(resourceQuerySchema, 'query', 422), controller.list);
  router.post('/', ...roles, validate(createSchema, 'body', 422), controller.create);
  router.get('/:id', ...roles, validate(objectIdParamsSchema, 'params', 422), controller.get);
  router.patch('/:id', ...roles, validate(objectIdParamsSchema, 'params', 422), validate(updateSchema, 'body', 422), controller.update);
  router.delete('/:id', ...roles, validate(objectIdParamsSchema, 'params', 422), controller.remove);
  return router;
}

export const vehicleRoutes = createResourceRoutes('vehicles', vehicleSchema, vehicleUpdateSchema);
export const driverRoutes = createResourceRoutes('drivers', driverSchema, driverUpdateSchema);