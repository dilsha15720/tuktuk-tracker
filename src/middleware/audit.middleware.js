import { recordHistoryAccess } from '../services/audit.service.js';

/**
 * Record access to a movement-history endpoint before its handler runs.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {import('express').NextFunction} next Express next function.
 * @returns {Promise<void>} Middleware promise.
 */
export async function auditHistoryAccess(req, res, next) {
  try {
    await recordHistoryAccess(req);
    next();
  } catch (error) {
    next(error);
  }
}
