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
