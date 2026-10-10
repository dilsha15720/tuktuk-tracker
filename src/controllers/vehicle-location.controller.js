import * as vehicleLocationService from '../services/vehicle-location.service.js';
import { sendConditionalJson } from '../utils/conditional-get.js';

/**
 * Set pagination links on a response.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {{page: number, pages: number, limit: number}} pagination Pagination metadata.
 * @returns {void}
 */
function setLinks(req, res, pagination) {
  const links = [];
  if (pagination.page > 1) links.push(`<${req.baseUrl}${req.path}?page=${pagination.page - 1}&limit=${pagination.limit}>; rel="prev"`);
  if (pagination.page < pagination.pages) links.push(`<${req.baseUrl}${req.path}?page=${pagination.page + 1}&limit=${pagination.limit}>; rel="next"`);
  if (links.length) res.set('Link', links.join(', '));
}

/**
 * Return one vehicle's last known location.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @returns {Promise<void>} Response promise.
 */
export async function getLastLocation(req, res) {
  const location = await vehicleLocationService.getLastLocation(req.params.id, req.user);
  if (!location) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Vehicle last location not found' } });
  sendConditionalJson(req, res, location);
}

/**
 * Return historical locations for a vehicle.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @returns {Promise<void>} Response promise.
 */
export async function getHistory(req, res) {
  const result = await vehicleLocationService.listVehicleLocations(req.params.id, req.query, req.user);
  setLinks(req, res, result.pagination);
  const lastModified = result.data.reduce((latest, item) => item.recordedAt > latest ? item.recordedAt : latest, null);
  sendConditionalJson(req, res, result, { lastModified });
}

/**
 * Return latest locations for a jurisdiction.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @returns {Promise<void>} Response promise.
 */
export async function getLive(req, res) {
  const result = await vehicleLocationService.listLiveLocations(req.query, req.user);
  setLinks(req, res, result.pagination);
  const lastModified = result.data.reduce((latest, item) => item.recordedAt > latest ? item.recordedAt : latest, null);
  sendConditionalJson(req, res, result, { lastModified });
}

/**
 * Return latest locations near a coordinate.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @returns {Promise<void>} Response promise.
 */
export async function getNearby(req, res) {
  const result = await vehicleLocationService.listNearbyLocations(req.query, req.user);
  setLinks(req, res, result.pagination);
  res.json(result);
}