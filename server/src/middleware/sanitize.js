import { stripMongoOperators } from '../utils/sanitize.js';

/** Removes Mongo operator keys ($where, $ne, a.b ...) from all user-controlled input. */
export const sanitizeInput = (req, _res, next) => {
  if (req.body) stripMongoOperators(req.body);
  if (req.query) stripMongoOperators(req.query);
  if (req.params) stripMongoOperators(req.params);
  next();
};
