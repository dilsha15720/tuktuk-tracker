import Province from '../models/province.model.js';
import District from '../models/district.model.js';
import PoliceStation from '../models/police-station.model.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Build a paginated query using only allowlisted sort fields.
 * @param {import('mongoose').Model} Model Mongoose model.
 * @param {object} filter Safe MongoDB filter.
 * @param {{page?: number, limit?: number, sort?: string, order?: string}} query Validated query values.
 * @param {string[]} allowedSortFields Allowed sort fields.
 * @returns {Promise<{data: object[], pagination: object}>} Page and metadata.
 */
async function paginate(Model, filter, query, allowedSortFields) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
  const sortField = allowedSortFields.includes(query.sort) ? query.sort : allowedSortFields[0];
  const direction = query.order === 'desc' ? -1 : 1;
  const sort = { [sortField]: direction };
  const [data, total] = await Promise.all([
    Model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Model.countDocuments(filter)
  ]);
  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit), sort: sortField, order: direction === -1 ? 'desc' : 'asc' } };
}

/**
 * List provinces with pagination, filtering, sorting, and lean documents.
 * @param {object} query Validated query values.
 * @returns {Promise<{data: object[], pagination: object}>} Province page.
 */
export function listProvinces(query) {
  const search = query.search ? escapeRegex(query.search) : null;
  const filter = search ? { $or: [{ name: new RegExp(search, 'i') }, { code: new RegExp(search, 'i') }] } : {};
  return paginate(Province, filter, query, ['name', 'code', 'createdAt']);
}

/**
 * List districts for one province.
 * @param {string} provinceId Province ObjectId.
 * @param {object} query Validated query values.
 * @returns {Promise<{data: object[], pagination: object}>} District page.
 */
export function listProvinceDistricts(provinceId, query) {
  const filter = { province: provinceId };
  if (query.search) {
    const search = escapeRegex(query.search);
    filter.$or = [{ name: new RegExp(search, 'i') }, { code: new RegExp(search, 'i') }];
  }
  return paginate(District, filter, query, ['name', 'code', 'createdAt']);
}

/**
 * List districts across all provinces.
 * @param {object} query Validated query values.
 * @returns {Promise<{data: object[], pagination: object}>} District page.
 */
export function listDistricts(query) {
  const filter = {};
  if (query.provinceId) filter.province = query.provinceId;
  if (query.search) filter.$or = [{ name: new RegExp(query.search, 'i') }, { code: new RegExp(query.search, 'i') }];
  return paginate(District, filter, query, ['name', 'code', 'createdAt']);
}

/**
 * List police stations for one district.
 * @param {string} districtId District ObjectId.
 * @param {object} query Validated query values.
 * @returns {Promise<{data: object[], pagination: object}>} Station page.
 */
export function listDistrictStations(districtId, query) {
  const filter = { district: districtId };
  if (query.search) {
    const search = escapeRegex(query.search);
    filter.$or = [{ name: new RegExp(search, 'i') }, { stationCode: new RegExp(search, 'i') }];
  }
  return paginate(PoliceStation, filter, query, ['name', 'stationCode', 'createdAt']);
}
