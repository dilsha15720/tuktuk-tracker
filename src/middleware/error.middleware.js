/**
 * Handle unmatched API routes with a consistent error envelope.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @returns {void}
 */
export function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} was not found` } });
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
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    error: {
      code: statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR',
      message: statusCode >= 500 ? 'An unexpected server error occurred' : error.message,
      ...(error.details ? { details: error.details } : {})
    }
  });
}
