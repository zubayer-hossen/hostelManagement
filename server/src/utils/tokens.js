import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Access token: short-lived, sent as Bearer header, kept in memory by the client.
 * Payload deliberately holds NO role/permissions — they are always loaded from the database.
 */
export const signAccessToken = ({ userId, sessionId }) =>
  jwt.sign({ sub: String(userId), sid: String(sessionId) }, config.JWT_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN,
    algorithm: 'HS256',
  });

export const verifyAccessToken = (token) => jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });

/** Refresh token: long-lived, HTTP-only cookie. `jti` rotates on every use. */
export const signRefreshToken = ({ userId, sessionId, jti }) =>
  jwt.sign({ sub: String(userId), sid: String(sessionId), jti }, config.JWT_REFRESH_SECRET, {
    expiresIn: `${config.REFRESH_TOKEN_DAYS}d`,
    algorithm: 'HS256',
  });

export const verifyRefreshToken = (token) =>
  jwt.verify(token, config.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });

/** Random token for e-mail verification / password reset (raw goes in the e-mail, hash in the DB). */
export const generateRandomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

export const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
