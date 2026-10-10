import LocationPing from '../models/location-ping.model.js';
import VehicleLastLocation from '../models/vehicle-last-location.model.js';
import { jurisdictionFilter } from '../utils/jurisdiction.js';

/**
 * Build pagination metadata and bounds.
 * @param {object} query Validated query.
 * @returns {{page: number, limit: number, skip: number}} Pagination values.
 */
function pagination(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

/**
 * Read one vehicle's latest scoped location.
 * @param {string} vehicleId Vehicle ObjectId.
 * @param {object} user Authenticated user claims.
 * @returns {Promise<object|null>} Latest location or null.
 */
export function getLastLocation(vehicleId, user) {
  return VehicleLastLocation.findOne({ vehicleId, ...jurisdictionFilter(user) }).lean();
}

/**
 * List historical pings for a scoped vehicle in chronological order.
 * @param {string} vehicleId Vehicle ObjectId.
 * @param {object} query Validated date and pagination query.
 * @param {object} user Authenticated user claims.
 * @returns {Promise<{data: object[], pagination: object}>} History page.
 */
export async function listVehicleLocations(vehicleId, query, user) {
  const pageInfo = pagination(query);
  const filter = { vehicleId, ...jurisdictionFilter(user), recordedAt: { $gte: query.from, $lte: query.to } };
  const [data, total] = await Promise.all([
    LocationPing.find(filter).sort({ recordedAt: 1 }).skip(pageInfo.skip).limit(pageInfo.limit).lean(),
    LocationPing.countDocuments(filter)
  ]);
  return { data, pagination: { page: pageInfo.page, limit: pageInfo.limit, total, pages: Math.ceil(total / pageInfo.limit) } };
}

/**
 * Read latest locations for a scoped jurisdiction.
 * @param {object} query Validated filter and pagination query.
 * @param {object} user Authenticated user claims.
 * @returns {Promise<{data: object[], pagination: object}>} Live location page.
 */
export async function listLiveLocations(query, user) {
  const pageInfo = pagination(query);
  const filter = { ...jurisdictionFilter(user) };
  if (query.province) filter.provinceId = query.province;
  if (query.district) filter.districtId = query.district;
  const [data, total] = await Promise.all([
    VehicleLastLocation.find(filter).sort({ recordedAt: -1 }).skip(pageInfo.skip).limit(pageInfo.limit).lean(),
    VehicleLastLocation.countDocuments(filter)
  ]);
  return { data, pagination: { page: pageInfo.page, limit: pageInfo.limit, total, pages: Math.ceil(total / pageInfo.limit) } };
}

/**
 * Find latest locations near a point using the 2dsphere index.
 * @param {object} query Validated coordinates, radius, and pagination query.
 * @param {object} user Authenticated user claims.
 * @returns {Promise<{data: object[], pagination: object}>} Nearby location page.
 */
export async function listNearbyLocations(query, user) {
  const pageInfo = pagination(query);
  const filter = {
    ...jurisdictionFilter(user),
    location: { $near: { $geometry: { type: 'Point', coordinates: [query.lng, query.lat] }, $maxDistance: query.radius * 1000 } }
  };
  const data = await VehicleLastLocation.find(filter).skip(pageInfo.skip).limit(pageInfo.limit).lean();
  return { data, pagination: { page: pageInfo.page, limit: pageInfo.limit, total: data.length, pages: data.length ? pageInfo.page : 0 } };
}
