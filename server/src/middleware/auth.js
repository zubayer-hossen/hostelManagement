import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { resolvePermissions } from '../services/permissionService.js';
import { STAFF_ROLES } from '../constants/roles.js';

function extractBearer(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
}

/**
 * Authenticates the request. Identity ALWAYS comes from the verified token + database:
 * role, permissions and active state are re-read from MongoDB on every request, and the
 * session must still be valid, so deactivation / role changes / logout take effect immediately.
 */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractBearer(req);
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token', { code: 'TOKEN_EXPIRED' });
  }

  const [user, session] = await Promise.all([
    User.findOne({ _id: payload.sub, deletedAt: null }),
    Session.exists({ _id: payload.sid, user: payload.sub, revokedAt: null, expiresAt: { $gt: new Date() } }),
  ]);

  if (!user || !session) throw ApiError.unauthorized('Session is no longer valid', { code: 'TOKEN_EXPIRED' });
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated', { code: 'ACCOUNT_INACTIVE' });

  req.user = user;
  req.sessionId = String(payload.sid);
  req.permissions = await resolvePermissions(user);
  next();
});

/** Requires ALL listed permissions. Use after `authenticate`. */
export const requirePermission = (...needed) => (req, _res, next) => {
  const held = req.permissions || [];
  if (!needed.every((p) => held.includes(p))) return next(ApiError.forbidden());
  return next();
};

/** Requires ANY of the listed permissions. */
export const requireAnyPermission = (...needed) => (req, _res, next) => {
  const held = req.permissions || [];
  if (!needed.some((p) => held.includes(p))) return next(ApiError.forbidden());
  return next();
};

/** Requires one of the listed roles. Prefer permissions; use roles only for role-specific areas. */
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(ApiError.forbidden());
  return next();
};

export const requireStaff = requireRole(...STAFF_ROLES);

/** Attaches req.user when a valid token is present; otherwise continues as an anonymous visitor (never errors). */
export const optionalAuth = (req, res, next) => {
  if (!extractBearer(req)) return next();
  return authenticate(req, res, () => next());
};
