import jwt from 'jsonwebtoken';

/**
 * Verify an access JWT from the Authorization header.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {import('express').NextFunction} next Express next function.
 * @returns {void}
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Use Bearer token authentication' } });
  try {
    if (!process.env.JWT_SECRET) throw new Error('JWT secret is not configured');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.tokenType && payload.tokenType !== 'access') throw new Error('Wrong token type');
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired access token' } });
  }
}

/**
 * Authorize one or more roles after authentication.
 * @param {...string} roles Allowed role names.
 * @returns {import('express').RequestHandler} Express middleware.
 */
export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permission' } });
    }
    next();
  };
}

export const authMiddleware = authenticate;
export const requireRoles = authorizeRoles;
