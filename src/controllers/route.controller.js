import Route from '../models/route.model.js';

/** List routes. @param {import('express').Request} req Request. @param {import('express').Response} res Response. @returns {Promise<void>} Response promise. */
export const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Get one route. @param {import('express').Request} req Request. @param {import('express').Response} res Response. @returns {Promise<void>} Response promise. */
export const getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: 'Route not found' });
    res.json(route);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/** Create a route. @param {import('express').Request} req Request. @param {import('express').Response} res Response. @returns {Promise<void>} Response promise. */
export const createRoute = async (req, res) => {
  try {
    const r = new Route(req.body);
    await r.save();
    res.status(201).json(r);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
