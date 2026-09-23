import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Extra CSRF defence for cookie-authenticated endpoints (refresh / logout):
 * if the browser sends an Origin header it must match CLIENT_URL.
 */
export const verifyOrigin = (req, _res, next) => {
  const origin = req.headers.origin;
  if (origin && origin !== config.clientOrigin) {
    return next(ApiError.forbidden('Request origin not allowed'));
  }
  return next();
};
