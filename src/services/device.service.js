import crypto from 'node:crypto';
import Device from '../models/device.model.js';

/**
 * Hash a device key before persistence or comparison.
 * @param {string} key Plain device key.
 * @returns {string} Hex SHA-256 digest.
 */
export function hashDeviceKey(key) {
  return crypto.createHash('sha256').update(key, 'utf8').digest('hex');
}

/**
 * Generate a device code and a plain key. The plain key is returned only once.
 * @param {string|undefined} requestedCode Optional stable device code.
 * @returns {{deviceCode: string, plainKey: string, apiKeyHash: string}} Key material.
 */
export function generateDeviceKey(requestedCode) {
  const deviceCode = requestedCode || `DEV-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  const plainKey = `${deviceCode}.${crypto.randomBytes(32).toString('hex')}`;
  return { deviceCode, plainKey, apiKeyHash: hashDeviceKey(plainKey) };
}

/**
 * Create a device with a hashed key.
 * @param {{vehicleId: string, deviceCode?: string}} input Validated input.
 * @returns {Promise<{device: object, plainKey: string}>} Created device and one-time key.
 */
export async function createDevice(input) {
  const key = generateDeviceKey(input.deviceCode);
  const device = await Device.create({ ...input, deviceCode: key.deviceCode, apiKeyHash: key.apiKeyHash });
  const safeDevice = device.toObject();
  delete safeDevice.apiKeyHash;
  return { device: safeDevice, plainKey: key.plainKey };
}

/**
 * List active and revoked devices without secret hashes.
 * @returns {Promise<object[]>} Device list.
 */
export function listDevices() {
  return Device.find().select('-apiKeyHash').sort({ createdAt: -1 }).lean();
}

/**
 * Revoke or rotate a device key.
 * @param {string} deviceId Device ObjectId.
 * @param {'revoke'|'rotate'} action Requested operation.
 * @returns {Promise<{device: object, plainKey?: string}|null>} Updated device.
 */
export async function updateDevice(deviceId, action) {
  const device = await Device.findById(deviceId).select('+apiKeyHash');
  if (!device) return null;
  if (action === 'revoke') {
    device.isActive = false;
    await device.save();
    const safeDevice = device.toObject();
    delete safeDevice.apiKeyHash;
    return { device: safeDevice };
  }
  const key = generateDeviceKey(device.deviceCode);
  device.apiKeyHash = key.apiKeyHash;
  device.isActive = true;
  await device.save();
  const safeDevice = device.toObject();
  delete safeDevice.apiKeyHash;
  return { device: safeDevice, plainKey: key.plainKey };
}
