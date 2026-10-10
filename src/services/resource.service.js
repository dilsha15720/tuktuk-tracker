import Vehicle from '../models/vehicle.model.js';
import Driver from '../models/driver.model.js';
import { apiError } from '../utils/api-error.js';
import { jurisdictionFilter } from '../utils/jurisdiction.js';

const models = { vehicles: Vehicle, drivers: Driver };
const fields = {
  vehicles: new Set(['plateNumber', 'provinceId', 'districtId', 'stationId', 'driverId', 'deviceId', 'status', 'createdAt', 'updatedAt']),
  drivers: new Set(['fullName', 'licenceNumber', 'phoneNumber', 'provinceId', 'districtId', 'stationId', 'isActive', 'createdAt', 'updatedAt'])
};

/**
 * Escape user text before constructing a regular expression.
 * @param {string} value User search text.
 * @returns {string} Literal-safe regex text.
 */
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Add a jurisdiction claim to a write payload and reject cross-scope writes.
 * @param {object} input Validated input.
 * @param {object} user Authenticated user claims.
 * @returns {object} Scoped input.
 */
function applyWriteScope(input, user) {
  if (user.role === 'HQ_ADMIN') return input;
  const scope = jurisdictionFilter(user);
  for (const [key, value] of Object.entries(scope)) {
    if (key === '_id') continue;
    if (input[key] && String(input[key]) !== String(value)) throw apiError(403, 'Resource is outside your jurisdiction');
    input[key] = value;
  }
  return input;
}

/**
 * Build a safe resource filter from validated query values and user scope.
 * @param {string} resource Resource name.
 * @param {object} query Validated query values.
 * @param {object} user Authenticated user claims.
 * @returns {object} MongoDB filter.
 */
function buildFilter(resource, query, user) {
  const filter = { ...jurisdictionFilter(user) };
  if (query.province) filter.provinceId = query.province;
  if (query.district) filter.districtId = query.district;
  if (resource === 'vehicles' && query.status) filter.status = query.status;
  if (resource === 'vehicles' && query.plate) filter.plateNumber = new RegExp(escapeRegex(query.plate), 'i');
  if (resource === 'drivers' && query.plate) filter.licenceNumber = new RegExp(escapeRegex(query.plate), 'i');
  return filter;
}

/**
 * Select only allowlisted fields.
 * @param {string} resource Resource name.
 * @param {string|undefined} requested Requested comma-separated fields.
 * @returns {string|undefined} Safe Mongoose projection.
 */
function projection(resource, requested) {
  if (!requested) return undefined;
  const allowed = fields[resource];
  const selected = requested.split(',').filter((field) => allowed.has(field));
  return selected.length ? selected.join(' ') : undefined;
}

/**
 * List vehicles or drivers with scope, filtering, sorting, pagination, and projection.
 * @param {'vehicles'|'drivers'} resource Resource name.
 * @param {object} query Validated query.
 * @param {object} user Authenticated user.
 * @returns {Promise<{data: object[], pagination: object}>} Resource page.
 */
export async function listResources(resource, query, user) {
  const Model = models[resource];
  const filter = buildFilter(resource, query, user);
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
  const allowedSort = resource === 'vehicles' ? ['createdAt', 'plateNumber', 'status'] : ['createdAt', 'fullName', 'licenceNumber'];
  const requestedSort = String(query.sort || 'createdAt');
  const sortField = requestedSort.replace(/^-/, '');
  const sort = { [allowedSort.includes(sortField) ? sortField : 'createdAt']: requestedSort.startsWith('-') ? -1 : 1 };
  const [data, total] = await Promise.all([
    Model.find(filter).select(projection(resource, query.fields)).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Model.countDocuments(filter)
  ]);
  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

/**
 * Create a scoped vehicle or driver.
 * @param {'vehicles'|'drivers'} resource Resource name.
 * @param {object} input Validated input.
 * @param {object} user Authenticated user.
 * @returns {Promise<object>} Created document.
 */
export async function createResource(resource, input, user) {
  return models[resource].create(applyWriteScope({ ...input }, user));
}

/**
 * Find one scoped resource.
 * @param {'vehicles'|'drivers'} resource Resource name.
 * @param {string} id Resource ObjectId.
 * @param {object} user Authenticated user.
 * @returns {Promise<object|null>} Lean resource or null.
 */
export function getResource(resource, id, user) {
  return models[resource].findOne({ _id: id, ...jurisdictionFilter(user) }).lean();
}

/**
 * Update one scoped resource.
 * @param {'vehicles'|'drivers'} resource Resource name.
 * @param {string} id Resource ObjectId.
 * @param {object} input Validated input.
 * @param {object} user Authenticated user.
 * @returns {Promise<object|null>} Updated resource or null.
 */
export function updateResource(resource, id, input, user) {
  return models[resource].findOneAndUpdate({ _id: id, ...jurisdictionFilter(user) }, applyWriteScope({ ...input }, user), { new: true, runValidators: true }).lean();
}

/**
 * Delete one scoped resource.
 * @param {'vehicles'|'drivers'} resource Resource name.
 * @param {string} id Resource ObjectId.
 * @param {object} user Authenticated user.
 * @returns {Promise<object|null>} Deleted resource or null.
 */
export function deleteResource(resource, id, user) {
  return models[resource].findOneAndDelete({ _id: id, ...jurisdictionFilter(user) }).lean();
}
