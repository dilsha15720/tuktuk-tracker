/**
 * Forward rejected async route handlers to central Express error middleware.
 * @param {Function} handler Async Express handler.
 * @returns {import('express').RequestHandler} Wrapped Express handler.
 */
export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
