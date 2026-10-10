/**
 * Recursively remove MongoDB operator and dotted keys from untrusted input.
 * @param {unknown} value Request value to sanitize.
 * @returns {unknown} Safe copy of the value.
 */
function sanitize(value, unsafeKeys) {
  if (Array.isArray(value)) return value.map((item) => sanitize(item, unsafeKeys));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => {
      const unsafe = key.startsWith('$') || key.includes('.');
      if (unsafe) unsafeKeys.found = true;
      return !unsafe;
    })
    .map(([key, child]) => [key, sanitize(child, unsafeKeys)]));
}

/**
 * Sanitize body, query, and route parameters before controllers use them.
 * @returns {import('express').RequestHandler} Express middleware.
 */
export function sanitizeInput() {
  return (req, res, next) => {
    const unsafeKeys = { found: false };
    req.body = sanitize(req.body, unsafeKeys);
    Object.defineProperty(req, 'query', { configurable: true, enumerable: true, writable: true, value: sanitize(req.query, unsafeKeys) });
    req.params = sanitize(req.params, unsafeKeys);
    if (unsafeKeys.found) {
      return res.status(400).json({ status: 400, code: 'UNSAFE_INPUT', message: 'Request contains unsafe MongoDB operator keys', details: null });
    }
    next();
  };
}
