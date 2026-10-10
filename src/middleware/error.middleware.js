import Joi from 'joi';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { AppError } from '../utils/app-error.js';

/**
 * Handle unmatched API routes with a consistent error envelope.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @returns {void}
 */
export function notFoundHandler(req, res) {
  res.status(404).json({ status: 404, code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} was not found`, details: null });
}

/**
 * Convert uncaught errors into a safe consistent response.
 * @param {Error & {statusCode?: number, details?: object}} error Application error.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {import('express').NextFunction} next Express next function.
 * @returns {void}
 */
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let status = error.status || error.statusCode || 500;
  let code = error.code || 'INTERNAL_ERROR';
  let message = error.message || 'An unexpected server error occurred';
  let details = error.details || null;
  if (Joi.isError(error)) {
    status = 422;
    code = 'VALIDATION_ERROR';
    message = 'Request validation failed';
    details = error.details.map((item) => item.message);
  } else if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
    status = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid or expired token';
    details = null;
  } else if (error instanceof mongoose.Error.ValidationError) {
    status = 422;
    code = 'VALIDATION_ERROR';
    message = 'Database validation failed';
    details = Object.values(error.errors).map((item) => item.message);
  } else if (error instanceof mongoose.Error.CastError) {
    status = 400;
    code = 'INVALID_IDENTIFIER';
    message = 'Invalid resource identifier';
    details = null;
  } else if (error.code === 11000) {
    status = 409;
    code = 'DUPLICATE_RESOURCE';
    message = 'Resource already exists';
    details = error.keyValue || null;
  } else if (!(error instanceof AppError) || process.env.NODE_ENV === 'production') {
    if (status >= 500) {
      status = 500;
      code = 'INTERNAL_ERROR';
      message = 'An unexpected server error occurred';
      details = null;
    }
  }
  res.status(status).json({ status, code, message, details });
}
