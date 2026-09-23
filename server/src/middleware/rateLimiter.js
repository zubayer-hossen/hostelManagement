import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError.js';

const make = ({ windowMs, limit, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, _res, next) => next(ApiError.tooMany(message)),
  });

/** Global API limiter. */
export const apiLimiter = make({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  skip: (req) => req.path === '/health',
  message: 'Too many requests. Please try again later.',
});

/** Login / register / password flows — much stricter (brute-force protection). */
export const authLimiter = make({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: 'Too many attempts. Please wait a few minutes and try again.',
});

/** E-mail sending endpoints (forgot password, resend verification). */
export const emailLimiter = make({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  message: 'Too many e-mail requests. Please try again in an hour.',
});

/** Public contact form: a handful of messages per hour per IP. */
export const contactLimiter = make({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: 'You have sent several messages recently. Please try again later.',
});

/** Ticket tracking by code + secret: blocks guessing. */
export const trackLimiter = make({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  message: 'Too many lookups. Please wait a few minutes.',
});
