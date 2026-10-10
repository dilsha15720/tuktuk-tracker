import Joi from 'joi';

/**
 * Validate one request section with a Joi schema.
 * @param {Joi.ObjectSchema} schema Joi validation schema.
 * @param {'body'|'query'|'params'} source Request section to validate.
 * @returns {import('express').RequestHandler} Express middleware.
 */
export function validate(schema, source) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details: error.details.map((item) => item.message) }
      });
    }
    req[source] = value;
    next();
  };
}

export const loginSchema = Joi.object({
  username: Joi.string().trim().min(3).max(100).required(),
  password: Joi.string().min(1).max(200).required()
});

export const locationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required()
});

const tukFields = {
  tukId: Joi.string().trim().max(30),
  registration: Joi.string().trim().max(30),
  deviceId: Joi.string().trim().max(100),
  route: Joi.string().hex().length(24),
  province: Joi.string().hex().length(24),
  district: Joi.string().hex().length(24),
  policeStation: Joi.string().hex().length(24),
  driverName: Joi.string().trim().max(100),
  status: Joi.string().valid('On Route', 'Stopped', 'Delayed'),
  schedule: Joi.array().items(Joi.object({
    tripDate: Joi.date(),
    departureTime: Joi.string().max(20),
    arrivalTime: Joi.string().max(20)
  }))
};

export const createTukSchema = Joi.object(tukFields).fork(
  ['tukId', 'registration', 'deviceId', 'province', 'district', 'policeStation'],
  (field) => field.required()
);
export const updateTukSchema = Joi.object(tukFields).min(1);

export const routeSchema = Joi.object({
  routeCode: Joi.string().trim().max(20).required(),
  name: Joi.string().trim().max(100).required(),
  origin: Joi.string().trim().max(100).required(),
  destination: Joi.string().trim().max(100).required(),
  stops: Joi.array().items(Joi.string().trim().max(100)).default([]),
  distanceKm: Joi.number().min(0)
});

export const bulkLocationSchema = Joi.array().items(Joi.object({
  tukId: Joi.string().trim().max(30),
  busId: Joi.string().trim().max(30),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required()
}).or('tukId', 'busId')).min(1).max(500);

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  sort: Joi.string().max(40),
  search: Joi.string().trim().max(100),
  status: Joi.string().valid('On Route', 'Stopped', 'Delayed'),
  route: Joi.string().hex().length(24),
  province: Joi.string().max(30),
  district: Joi.string().max(30),
  policeStation: Joi.string().max(30)
});

export const objectIdParamsSchema = Joi.object({
  id: Joi.string().hex().length(24).required()
});

export const administrationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  sort: Joi.string().valid('name', 'code', 'stationCode', 'createdAt'),
  order: Joi.string().valid('asc', 'desc').default('asc'),
  search: Joi.string().trim().max(100),
  provinceId: Joi.string().hex().length(24)
});
