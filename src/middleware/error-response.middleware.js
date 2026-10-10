/**
 * Normalize legacy controller error responses into the public API envelope.
 * @returns {import('express').RequestHandler} Express middleware.
 */
export function normalizeErrorResponses() {
  return (req, res, next) => {
    const sendJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 400 && body && body.message && !body.error) {
        return sendJson({ error: { code: 'REQUEST_ERROR', message: body.message } });
      }
      return sendJson(body);
    };
    next();
  };
}
