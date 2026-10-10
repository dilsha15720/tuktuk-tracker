import * as deviceService from '../services/device.service.js';

/**
 * Create a device and return its plain key once.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @returns {Promise<void>} Response promise.
 */
export async function createDevice(req, res) {
  const result = await deviceService.createDevice(req.body);
  res.status(201).json(result);
}

/**
 * List devices without API key hashes.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @returns {Promise<void>} Response promise.
 */
export async function getDevices(req, res) {
  res.json({ data: await deviceService.listDevices() });
}

/**
 * Revoke or rotate a device key.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @returns {Promise<void>} Response promise.
 */
export async function updateDevice(req, res) {
  const result = await deviceService.updateDevice(req.params.id, req.body.action);
  if (!result) return res.status(404).json({ error: { code: 'DEVICE_NOT_FOUND', message: 'Device not found' } });
  res.json(result);
}
