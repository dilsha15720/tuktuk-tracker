import * as resourceService from '../services/resource.service.js';

/**
 * Create a generic resource controller set.
 * @param {'vehicles'|'drivers'} resource Resource name.
 * @returns {object} Express handlers.
 */
export function resourceController(resource) {
  return {
    list: async (req, res, next) => {
      try {
        const result = await resourceService.listResources(resource, req.query, req.user);
        const links = [];
        if (result.pagination.page > 1) links.push(`<${req.baseUrl}?page=${result.pagination.page - 1}&limit=${result.pagination.limit}>; rel="prev"`);
        if (result.pagination.page < result.pagination.pages) links.push(`<${req.baseUrl}?page=${result.pagination.page + 1}&limit=${result.pagination.limit}>; rel="next"`);
        if (links.length) res.set('Link', links.join(', '));
        res.json(result);
      } catch (error) { next(error); }
    },
    create: async (req, res, next) => {
      try {
        const created = await resourceService.createResource(resource, req.body, req.user);
        res.location(`${req.baseUrl}/${created._id}`).status(201).json(created);
      } catch (error) {
        if (error.code === 11000) return res.status(409).json({ error: { code: 'DUPLICATE_RESOURCE', message: 'Resource already exists' } });
        next(error);
      }
    },
    get: async (req, res, next) => {
      try {
        const found = await resourceService.getResource(resource, req.params.id, req.user);
        if (!found) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } });
        res.json(found);
      } catch (error) { next(error); }
    },
    update: async (req, res, next) => {
      try {
        const updated = await resourceService.updateResource(resource, req.params.id, req.body, req.user);
        if (!updated) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } });
        res.json(updated);
      } catch (error) {
        if (error.code === 11000) return res.status(409).json({ error: { code: 'DUPLICATE_RESOURCE', message: 'Resource already exists' } });
        next(error);
      }
    },
    remove: async (req, res, next) => {
      try {
        const deleted = await resourceService.deleteResource(resource, req.params.id, req.user);
        if (!deleted) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } });
        res.status(204).send();
      } catch (error) { next(error); }
    }
  };
}
