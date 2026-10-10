import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { validate, loginSchema } from '../middleware/validate.middleware.js';
const router = express.Router();

const passwordMatches = async (password, hash, legacyPassword) => {
  if (hash) return bcrypt.compare(password, hash);
  return process.env.NODE_ENV === 'test' && password === legacyPassword;
};

router.post('/login', validate(loginSchema, 'body'), async (req, res) => {
  const { username, password } = req.body;
  const users = [
    { username: process.env.ADMIN_USER, hash: process.env.ADMIN_PASS_HASH, legacyPassword: process.env.ADMIN_PASS, role: 'HQ_ADMIN' },
    { username: process.env.OPERATOR_USER, hash: process.env.OPERATOR_PASS_HASH, legacyPassword: process.env.OPERATOR_PASS, role: 'DEVICE', scope: { policeStation: process.env.OPERATOR_STATION_ID } },
    { username: process.env.PROVINCIAL_USER, hash: process.env.PROVINCIAL_PASS_HASH, legacyPassword: process.env.PROVINCIAL_PASS, role: 'PROVINCIAL_OFFICER', scope: { province: process.env.PROVINCIAL_PROVINCE_ID } },
    { username: process.env.STATION_USER, hash: process.env.STATION_PASS_HASH, legacyPassword: process.env.STATION_PASS, role: 'STATION_OFFICER', scope: { policeStation: process.env.STATION_ID } }
  ];
  const user = users.find((candidate) => candidate.username === username);
  if (user && await passwordMatches(password, user.hash, user.legacyPassword)) {
    const token = jwt.sign({ username, role: user.role, scope: user.scope }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    });
    return res.json({ token, role: user.role });
  }
  return res.status(401).json({ message: 'Invalid credentials' });
});

export default router;
