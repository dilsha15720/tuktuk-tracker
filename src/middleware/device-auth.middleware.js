import crypto from 'node:crypto';
import Device from '../models/device.model.js';
import { hashDeviceKey } from '../services/device.service.js';

/**
 * Authenticate a tracking device using the X-Device-Key header.
 * The header format is `deviceCode.secret`; only its SHA-256 hash is stored.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {import('express').NextFunction} next Express next function.
 * @returns {Promise<void>} Middleware promise.
 */
export async function authenticateDevice(req, res, next) {
  const presentedKey = req.get('X-Device-Key');
  const deviceCode = presentedKey?.split('.')[0];
  if (!presentedKey || !deviceCode) {
    return res.status(401).json({ error: { code: 'DEVICE_AUTH_REQUIRED', message: 'X-Device-Key is required' } });
  }
  try {
    const device = await Device.findOne({ deviceCode, isActive: true }).select('+apiKeyHash').lean();
    const presentedHash = Buffer.from(hashDeviceKey(presentedKey), 'hex');
    const storedHash = device ? Buffer.from(device.apiKeyHash, 'hex') : Buffer.alloc(presentedHash.length);
    const valid = storedHash.length === presentedHash.length && crypto.timingSafeEqual(storedHash, presentedHash);
    if (!device || !valid) return res.status(401).json({ error: { code: 'INVALID_DEVICE_KEY', message: 'Invalid or revoked device key' } });
    if (req.params.deviceId && String(device._id) !== String(req.params.deviceId)) {
      return res.status(403).json({ error: { code: 'DEVICE_SCOPE_MISMATCH', message: 'Device key cannot post for another device' } });
    }
    req.device = device;
    req.deviceVehicleId = device.vehicleId;
    next();
  } catch (error) {
    next(error);
  }
}
