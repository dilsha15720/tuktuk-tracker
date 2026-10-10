import express from 'express';
import rateLimit from 'express-rate-limit';
import { validate, loginSchema, refreshSchema } from '../middleware/validate.middleware.js';
import { authenticateUser, issueTokens, refreshTokens } from '../services/auth.service.js';

const router = express.Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'LOGIN_RATE_LIMITED', message: 'Too many login attempts' } }
});

/**
 * Authenticate a user and issue access/refresh tokens.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @returns {Promise<void>} Response promise.
 */
async function login(req, res) {
  const user = await authenticateUser(req.body.username, req.body.password);
  if (!user) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
  const tokens = issueTokens(user);
  res.json({ ...tokens, token: tokens.accessToken, role: user.role });
}

/**
 * Rotate an access/refresh token pair from a valid refresh token.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @returns {Promise<void>} Response promise.
 */
async function refresh(req, res) {
  try {
    res.json(refreshTokens(req.body.refreshToken));
  } catch (error) {
    res.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' } });
  }
}

router.post('/login', loginLimiter, validate(loginSchema, 'body'), login);
router.post('/refresh', validate(refreshSchema, 'body'), refresh);

export default router;
