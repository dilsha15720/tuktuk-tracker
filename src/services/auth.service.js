import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

/**
 * Read a configured secret, allowing the test suite to reuse its JWT secret.
 * @param {string} name Environment variable name.
 * @returns {string} Secret value.
 * @throws {Error} When the secret is missing outside tests.
 */
function getSecret(name) {
  const value = process.env[name] || (process.env.NODE_ENV === 'test' ? process.env.JWT_SECRET : undefined);
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

/**
 * Find a user in MongoDB or the configured environment users and verify bcrypt credentials.
 * @param {string} username Login username.
 * @param {string} password Plaintext password supplied by the client.
 * @returns {Promise<object|null>} Safe authenticated user claims.
 */
export async function authenticateUser(username, password) {
  const databaseUser = await User.findOne({ username, isActive: true }).select('+passwordHash').lean();
  if (databaseUser) {
    if (!await bcrypt.compare(password, databaseUser.passwordHash)) return null;
    return {
      id: databaseUser._id.toString(),
      username: databaseUser.username,
      role: databaseUser.role,
      scope: {
        provinceId: databaseUser.provinceId,
        districtId: databaseUser.districtId,
        stationId: databaseUser.stationId
      }
    };
  }

  const configuredUsers = [
    { username: process.env.ADMIN_USER, hash: process.env.ADMIN_PASS_HASH, legacy: process.env.ADMIN_PASS, role: 'HQ_ADMIN' },
    { username: process.env.OPERATOR_USER, hash: process.env.OPERATOR_PASS_HASH, legacy: process.env.OPERATOR_PASS, role: 'DEVICE', scope: { stationId: process.env.OPERATOR_STATION_ID } },
    { username: process.env.PROVINCIAL_USER, hash: process.env.PROVINCIAL_PASS_HASH, legacy: process.env.PROVINCIAL_PASS, role: 'PROVINCIAL_OFFICER', scope: { provinceId: process.env.PROVINCIAL_PROVINCE_ID } },
    { username: process.env.STATION_USER, hash: process.env.STATION_PASS_HASH, legacy: process.env.STATION_PASS, role: 'STATION_OFFICER', scope: { stationId: process.env.STATION_ID, districtId: process.env.STATION_DISTRICT_ID } }
  ];
  const configuredUser = configuredUsers.find((candidate) => candidate.username === username);
  if (!configuredUser) return null;
  const valid = configuredUser.hash
    ? await bcrypt.compare(password, configuredUser.hash)
    : process.env.NODE_ENV === 'test' && password === configuredUser.legacy;
  return valid ? { username, role: configuredUser.role, scope: configuredUser.scope } : null;
}

/**
 * Issue access and refresh tokens for authenticated claims.
 * @param {object} user Safe user claims.
 * @returns {{accessToken: string, refreshToken: string, tokenType: string, expiresIn: string}} Tokens.
 */
export function issueTokens(user) {
  const accessExpiresIn = process.env.JWT_EXPIRES_IN || '8h';
  const claims = { sub: user.id, username: user.username, role: user.role, scope: user.scope };
  const accessToken = jwt.sign({ ...claims, tokenType: 'access' }, getSecret('JWT_SECRET'), { expiresIn: accessExpiresIn });
  const refreshToken = jwt.sign({ ...claims, tokenType: 'refresh' }, getSecret('REFRESH_TOKEN_SECRET'), { expiresIn: '30d' });
  return { accessToken, refreshToken, tokenType: 'Bearer', expiresIn: accessExpiresIn };
}

/**
 * Verify a refresh token and issue a new access/refresh pair.
 * @param {string} refreshToken Signed refresh token.
 * @returns {{accessToken: string, refreshToken: string, tokenType: string, expiresIn: string}} Tokens.
 */
export function refreshTokens(refreshToken) {
  const payload = jwt.verify(refreshToken, getSecret('REFRESH_TOKEN_SECRET'));
  if (payload.tokenType !== 'refresh') throw new Error('Invalid refresh token');
  return issueTokens(payload);
}
