/**
 * Normalize legacy controller error responses into the public API envelope.
 * @returns {import('express').RequestHandler} Express middleware.
 */
export function normalizeErrorResponses() {
  /** Normalize legacy error bodies. @param {import('express').Request} req Request. @param {import('express').Response} res Response. @param {import('express').NextFunction} next Next function. @returns {void} */
  return (req, res, next) => {
    const sendJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 400 && body && body.message && !body.error) {
        return sendJson({ status: res.statusCode, code: body.code || 'REQUEST_ERROR', message: body.message, details: body.details || null });
      }
      if (res.statusCode >= 400 && body?.error) {
        return sendJson({
          status: res.statusCode,
          code: body.error.code || 'REQUEST_ERROR',
          message: body.error.message || 'Request failed',
          details: body.error.details || null
        });
      }
      return sendJson(body);
    };
    next();
  };
}
