import * as administrationService from '../services/administration.service.js';

/**
 * Add pagination links to a response.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {{page: number, pages: number}} pagination Pagination metadata.
 * @returns {void}
 */
function setPaginationLinks(req, res, pagination) {
  const links = [];
  const makeLink = (page, relation) => {
    const url = new URL(req.originalUrl, 'http://localhost');
    url.searchParams.set('page', String(page));
    return `<${url.pathname}${url.search}>; rel="${relation}"`;
  };
  if (pagination.page > 1) links.push(makeLink(pagination.page - 1, 'prev'));
  if (pagination.page < pagination.pages) links.push(makeLink(pagination.page + 1, 'next'));
  if (links.length) res.set('Link', links.join(', '));
}

/**
 * List all provinces.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @returns {Promise<void>} Response promise.
 */
export async function getProvinces(req, res) {
  const result = await administrationService.listProvinces(req.query);
  setPaginationLinks(req, res, result.pagination);
  res.json(result);
}

/**
 * List districts belonging to a province.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @returns {Promise<void>} Response promise.
 */
export async function getProvinceDistricts(req, res) {
  const result = await administrationService.listProvinceDistricts(req.params.id, req.query);
  setPaginationLinks(req, res, result.pagination);
  res.json(result);
}

/**
 * List districts, optionally filtered by province.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @returns {Promise<void>} Response promise.
 */
export async function getDistricts(req, res) {
  const result = await administrationService.listDistricts(req.query);
  setPaginationLinks(req, res, result.pagination);
  res.json(result);
}

/**
 * List police stations belonging to a district.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @returns {Promise<void>} Response promise.
 */
export async function getDistrictPoliceStations(req, res) {
  const result = await administrationService.listDistrictStations(req.params.id, req.query);
  setPaginationLinks(req, res, result.pagination);
  res.json(result);
}
