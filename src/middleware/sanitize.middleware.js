/**
 * Recursively remove MongoDB operator and dotted keys from untrusted input.
 * @param {unknown} value Request value to sanitize.
 * @returns {unknown} Safe copy of the value.
 */
function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !key.startsWith('$') && !key.includes('.'))
    .map(([key, child]) => [key, sanitize(child)]));
}

/**
 * Sanitize body, query, and route parameters before controllers use them.
 * @returns {import('express').RequestHandler} Express middleware.
 */
export function sanitizeInput() {
  return (req, res, next) => {
    req.body = sanitize(req.body);
    Object.defineProperty(req, 'query', { configurable: true, enumerable: true, writable: true, value: sanitize(req.query) });
    req.params = sanitize(req.params);
    next();
  };
}
