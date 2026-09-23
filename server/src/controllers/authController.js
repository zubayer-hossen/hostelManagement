import { config } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyRefreshToken } from '../utils/tokens.js';
import * as authService from '../services/authService.js';
import { listActiveSessions, revokeSession } from '../services/sessionService.js';
import { logAudit } from '../services/auditService.js';

const COOKIE_NAME = 'dhms_refresh';
const COOKIE_PATH = '/api/v1/auth';

const cookieOptions = () => ({
  httpOnly: true,
  secure: config.COOKIE_SECURE,
  sameSite: config.COOKIE_SAMESITE,
  path: COOKIE_PATH,
  maxAge: config.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
});

const setRefreshCookie = (res, token) => res.cookie(COOKIE_NAME, token, cookieOptions());
const clearRefreshCookie = (res) => res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });

export const register = asyncHandler(async (req, res) => {
  const { user, requiresVerification, tokens } = await authService.register(req.body, req);

  if (requiresVerification) {
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Account created. Please check your email to verify your address.',
      data: { user, requiresVerification: true },
    });
  }
  setRefreshCookie(res, tokens.refreshToken);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Account created successfully',
    data: { user, accessToken: tokens.accessToken, requiresVerification: false },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { user, tokens } = await authService.login(req.body, req);
  setRefreshCookie(res, tokens.refreshToken);
  sendSuccess(res, { message: 'Logged in successfully', data: { user, accessToken: tokens.accessToken } });
});

export const refresh = asyncHandler(async (req, res) => {
  try {
    const { user, tokens } = await authService.refresh(req.cookies?.[COOKIE_NAME], req);
    setRefreshCookie(res, tokens.refreshToken);
    sendSuccess(res, { message: 'Session refreshed', data: { user, accessToken: tokens.accessToken } });
  } catch (err) {
    clearRefreshCookie(res);
    throw err;
  }
});

export const logout = asyncHandler(async (req, res) => {
  // Works with or without a valid access token: the refresh cookie identifies the session.
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await revokeSession(payload.sid, payload.sub, 'logout');
    } catch {
      /* token already invalid — nothing to revoke */
    }
  }
  clearRefreshCookie(res);
  sendSuccess(res, { message: 'Logged out' });
});

export const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutEverywhere(req.user._id);
  clearRefreshCookie(res);
  sendSuccess(res, { message: 'Logged out from all devices' });
});

export const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { user: req.user, permissions: req.permissions } });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);
  sendSuccess(res, { message: 'Profile updated', data: { user } });
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user._id, req.body, req.sessionId);
  await logAudit({ req, action: 'auth.password_changed', entity: 'User', entityId: req.user._id });
  sendSuccess(res, { message: 'Password changed. Other devices have been logged out.' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  sendSuccess(res, { message: 'If an account exists for that email, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  sendSuccess(res, { message: 'Password reset successfully. You can now log in.' });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.body.token);
  sendSuccess(res, { message: 'Email verified successfully' });
});

export const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerification(req.body.email);
  sendSuccess(res, { message: 'If the account exists and is not yet verified, a new email has been sent.' });
});

export const listSessions = asyncHandler(async (req, res) => {
  const sessions = await listActiveSessions(req.user._id);
  sendSuccess(res, {
    data: sessions.map((s) => ({ ...s.toJSON(), current: String(s._id) === req.sessionId })),
  });
});

export const revokeSessionById = asyncHandler(async (req, res) => {
  if (req.params.sessionId === req.sessionId) {
    throw ApiError.badRequest('Use logout to end the current session');
  }
  await revokeSession(req.params.sessionId, req.user._id, 'revoked_by_user');
  sendSuccess(res, { message: 'Session revoked' });
});

export const loginHistory = asyncHandler(async (req, res) => {
  const items = await authService.getLoginHistory(req.user._id);
  sendSuccess(res, { data: items });
});
