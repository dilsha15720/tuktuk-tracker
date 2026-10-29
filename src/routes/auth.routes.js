import express from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import User from '../models/user.model.js';
import Province from '../models/province.model.js';
import District from '../models/district.model.js';
import PoliceStation from '../models/police-station.model.js';
import { validate, loginSchema, refreshSchema, createUserSchema } from '../middleware/validate.middleware.js';
import { authenticateUser, issueTokens, refreshTokens } from '../services/auth.service.js';
import { authenticate, authorizeRoles } from '../utils/auth.js';
import { asyncHandler } from '../utils/async-handler.js';

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

async function createUser(req, res) {
  const { username, password, role, provinceId, districtId, stationId } = req.body;

  if (role === 'PROVINCIAL_OFFICER' && !await Province.exists({ _id: provinceId })) {
    return res.status(422).json({ status: 422, code: 'INVALID_JURISDICTION', message: 'Province does not exist', details: null });
  }
  if (role === 'STATION_OFFICER') {
    const districtExists = await District.exists({ _id: districtId });
    const stationExists = await PoliceStation.exists({ _id: stationId, district: districtId });
    if (!districtExists || !stationExists) {
      return res.status(422).json({ status: 422, code: 'INVALID_JURISDICTION', message: 'District or station is invalid', details: null });
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ username, passwordHash, role, provinceId, districtId, stationId });
  return res.status(201).json({ user: user.toJSON() });
}

router.post('/login', loginLimiter, validate(loginSchema, 'body'), asyncHandler(login));
router.post('/refresh', validate(refreshSchema, 'body'), asyncHandler(refresh));
router.post('/users', authenticate, authorizeRoles('HQ_ADMIN'), validate(createUserSchema, 'body', 422), asyncHandler(createUser));

export default router;
