import * as devicePingService from '../services/device-ping.service.js';

/**
 * Record one device ping.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @returns {Promise<void>} Response promise.
 */
export async function createPing(req, res, next) {
  try {
    res.status(201).json(await devicePingService.recordDevicePings(req.device, [req.body]));
  } catch (error) {
    next(error);
  }
}

/**
 * Record up to 100 device pings, skipping duplicate timestamps.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @returns {Promise<void>} Response promise.
 */
export async function createPingBatch(req, res, next) {
  try {
    res.status(201).json(await devicePingService.recordDevicePings(req.device, req.body));
  } catch (error) {
    next(error);
  }
}
