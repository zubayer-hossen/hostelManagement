import crypto from 'node:crypto';
import { Session } from '../models/Session.js';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { getClientIp, getUserAgent } from '../utils/requestMeta.js';
import { sha256, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js';

// Two tabs refreshing at the same moment present the same token; allow it for a few seconds.
const REUSE_GRACE_MS = 10 * 1000;
const refreshExpiry = () => new Date(Date.now() + config.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
const newJti = () => crypto.randomBytes(24).toString('hex');

/** Creates a session (one per device) and returns fresh access + refresh tokens. */
export async function createSession(user, req) {
  const jti = newJti();
  const session = await Session.create({
    user: user._id,
    currentJtiHash: sha256(jti),
    userAgent: getUserAgent(req),
    ip: getClientIp(req),
    expiresAt: refreshExpiry(),
  });

  return {
    session,
    accessToken: signAccessToken({ userId: user._id, sessionId: session._id }),
    refreshToken: signRefreshToken({ userId: user._id, sessionId: session._id, jti }),
  };
}

/**
 * Rotates the refresh token. Presenting an already-rotated token (reuse) revokes the whole session,
 * because it means the token was probably stolen.
 */
export async function rotateSession(refreshToken, req) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Session expired. Please log in again.');
  }

  const session = await Session.findOne({ _id: payload.sid, user: payload.sub, revokedAt: null });
  if (!session || session.expiresAt <= new Date()) {
    throw ApiError.unauthorized('Session expired. Please log in again.');
  }

  const presented = sha256(payload.jti);
  if (presented !== session.currentJtiHash) {
    const isPrevious = presented === session.previousJtiHash;
    const withinGrace = isPrevious && Date.now() - session.lastUsedAt.getTime() < REUSE_GRACE_MS;
    if (isPrevious && !withinGrace) {
      session.revokedAt = new Date();
      session.revokedReason = 'refresh_token_reuse';
      await session.save();
    }
    // Within the grace window a concurrent refresh (e.g. two browser tabs) is tolerated.
    if (!withinGrace) throw ApiError.unauthorized('Session expired. Please log in again.');
  }

  const jti = newJti();
  session.previousJtiHash = session.currentJtiHash;
  session.currentJtiHash = sha256(jti);
  session.lastUsedAt = new Date();
  session.expiresAt = refreshExpiry();
  session.ip = getClientIp(req);
  session.userAgent = getUserAgent(req);
  await session.save();

  return {
    session,
    userId: payload.sub,
    accessToken: signAccessToken({ userId: payload.sub, sessionId: session._id }),
    refreshToken: signRefreshToken({ userId: payload.sub, sessionId: session._id, jti }),
  };
}

export const revokeSession = (sessionId, userId, reason = 'logout') =>
  Session.updateOne(
    { _id: sessionId, user: userId, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason } }
  );

/** Revoke every session of a user, optionally keeping one (the current device). */
export const revokeAllSessions = (userId, { exceptSessionId, reason = 'revoked' } = {}) => {
  const filter = { user: userId, revokedAt: null };
  if (exceptSessionId) filter._id = { $ne: exceptSessionId };
  return Session.updateMany(filter, { $set: { revokedAt: new Date(), revokedReason: reason } });
};

export const listActiveSessions = (userId) =>
  Session.find({ user: userId, revokedAt: null, expiresAt: { $gt: new Date() } }).sort({ lastUsedAt: -1 });
