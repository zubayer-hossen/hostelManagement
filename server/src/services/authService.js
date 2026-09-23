import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';
import { User } from '../models/User.js';
import { LoginHistory } from '../models/LoginHistory.js';
import { ROLES } from '../constants/roles.js';
import { ApiError } from '../utils/ApiError.js';
import { getClientIp, getUserAgent } from '../utils/requestMeta.js';
import { generateRandomToken, sha256 } from '../utils/tokens.js';
import { createSession, rotateSession, revokeSession, revokeAllSessions } from './sessionService.js';
import { getHostelName } from './settingsService.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendPasswordChangedEmail } from './emailService.js';

const BCRYPT_ROUNDS = 12;
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;
// Compared against when the e-mail is unknown, so response time does not reveal whether an account exists.
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer-password', BCRYPT_ROUNDS);

export const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_ROUNDS);

const clientLink = (path, token) => `${config.CLIENT_URL.replace(/\/$/, '')}${path}?token=${token}`;

async function recordLogin({ req, user, email, success, reason }) {
  try {
    await LoginHistory.create({
      user: user?._id ?? null,
      email,
      success,
      reason,
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
    });
  } catch (err) {
    console.error('[auth] failed to record login history:', err.message);
  }
}

async function issueVerification(user) {
  const raw = generateRandomToken();
  await User.updateOne(
    { _id: user._id },
    { $set: { emailVerificationTokenHash: sha256(raw), emailVerificationExpires: new Date(Date.now() + VERIFY_TTL_MS) } }
  );
  await sendVerificationEmail(user, clientLink('/verify-email', raw), await getHostelName());
}

/** Public self-registration. Always creates a General User — role can never be chosen by the client. */
export async function register({ name, email, phone, password }, req) {
  const exists = await User.exists({ email });
  if (exists) throw ApiError.conflict('An account with this email already exists');

  const user = await User.create({
    name,
    email,
    phone,
    passwordHash: await hashPassword(password),
    role: ROLES.GENERAL_USER,
    emailVerified: false,
  });

  await issueVerification(user);
  await recordLogin({ req, user, email, success: true, reason: 'registered' });

  if (config.REQUIRE_EMAIL_VERIFICATION) {
    return { user, requiresVerification: true, tokens: null };
  }
  const tokens = await createSession(user, req);
  return { user, requiresVerification: false, tokens };
}

export async function login({ email, password }, req) {
  const user = await User.findOne({ email, deletedAt: null }).select('+passwordHash +failedLoginAttempts +lockUntil');

  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    await recordLogin({ req, email, success: false, reason: 'unknown_email' });
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    const minutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    await recordLogin({ req, user, email, success: false, reason: 'locked' });
    throw ApiError.tooMany(`Too many failed attempts. Try again in ${minutes} minute(s).`, { code: 'ACCOUNT_LOCKED' });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    const update =
      attempts >= config.LOGIN_MAX_ATTEMPTS
        ? { failedLoginAttempts: 0, lockUntil: new Date(Date.now() + config.LOGIN_LOCK_MINUTES * 60000) }
        : { failedLoginAttempts: attempts };
    await User.updateOne({ _id: user._id }, { $set: update });
    await recordLogin({ req, user, email, success: false, reason: 'wrong_password' });
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    await recordLogin({ req, user, email, success: false, reason: 'inactive' });
    throw ApiError.forbidden('This account has been deactivated. Please contact the hostel office.', { code: 'ACCOUNT_INACTIVE' });
  }

  if (config.REQUIRE_EMAIL_VERIFICATION && !user.emailVerified) {
    await recordLogin({ req, user, email, success: false, reason: 'email_not_verified' });
    throw ApiError.forbidden('Please verify your email address before logging in.', { code: 'EMAIL_NOT_VERIFIED' });
  }

  await User.updateOne(
    { _id: user._id },
    { $set: { failedLoginAttempts: 0, lastLoginAt: new Date() }, $unset: { lockUntil: 1 } }
  );
  await recordLogin({ req, user, email, success: true });

  const tokens = await createSession(user, req);
  const fresh = await User.findById(user._id);
  return { user: fresh, tokens };
}

export async function refresh(refreshToken, req) {
  if (!refreshToken) throw ApiError.unauthorized('Not logged in');
  const rotated = await rotateSession(refreshToken, req);

  const user = await User.findOne({ _id: rotated.userId, deletedAt: null });
  if (!user || !user.isActive) {
    await revokeSession(rotated.session._id, rotated.userId, 'user_unavailable');
    throw ApiError.unauthorized('Session expired. Please log in again.');
  }
  return { user, tokens: rotated };
}

export const logout = (sessionId, userId) => revokeSession(sessionId, userId, 'logout');
export const logoutEverywhere = (userId) => revokeAllSessions(userId, { reason: 'logout_all' });

export async function verifyEmail(token) {
  const user = await User.findOne({
    emailVerificationTokenHash: sha256(token),
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationTokenHash +emailVerificationExpires');

  if (!user) throw ApiError.badRequest('This verification link is invalid or has expired');

  user.emailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
  return user;
}

/** Always succeeds from the caller's point of view so accounts cannot be enumerated. */
export async function resendVerification(email) {
  const user = await User.findOne({ email, deletedAt: null });
  if (user && !user.emailVerified && user.isActive) await issueVerification(user);
}

export async function forgotPassword(email) {
  const user = await User.findOne({ email, deletedAt: null });
  if (!user || !user.isActive) return;

  const raw = generateRandomToken();
  await User.updateOne(
    { _id: user._id },
    { $set: { passwordResetTokenHash: sha256(raw), passwordResetExpires: new Date(Date.now() + RESET_TTL_MS) } }
  );
  await sendPasswordResetEmail(user, clientLink('/reset-password', raw), await getHostelName());
}

export async function resetPassword({ token, password }) {
  const user = await User.findOne({
    passwordResetTokenHash: sha256(token),
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordResetExpires');

  if (!user) throw ApiError.badRequest('This reset link is invalid or has expired');

  user.passwordHash = await hashPassword(password);
  user.passwordChangedAt = new Date();
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.emailVerified = true; // the user proved control of the mailbox
  await user.save();

  await revokeAllSessions(user._id, { reason: 'password_reset' });
  await sendPasswordChangedEmail(user, await getHostelName());
}

export async function changePassword(userId, { currentPassword, newPassword }, currentSessionId) {
  const user = await User.findById(userId).select('+passwordHash');
  const ok = user && (await bcrypt.compare(currentPassword, user.passwordHash));
  if (!ok) throw ApiError.badRequest('Current password is incorrect', { errors: [{ field: 'currentPassword', message: 'Current password is incorrect' }] });

  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  await user.save();

  await revokeAllSessions(user._id, { exceptSessionId: currentSessionId, reason: 'password_changed' });
  await sendPasswordChangedEmail(user, await getHostelName());
}

export async function updateProfile(userId, data) {
  const user = await User.findByIdAndUpdate(userId, { $set: data }, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

export const getLoginHistory = (userId, limit = 20) =>
  LoginHistory.find({ user: userId }).sort({ createdAt: -1 }).limit(limit);
