import { Router } from 'express';
import * as c from '../../controllers/authController.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { authLimiter, emailLimiter } from '../../middleware/rateLimiter.js';
import { verifyOrigin } from '../../middleware/verifyOrigin.js';
import * as v from '../../validations/auth.validation.js';

const router = Router();

// Public
router.post('/register', authLimiter, validate({ body: v.registerBody }), c.register);
router.post('/login', authLimiter, validate({ body: v.loginBody }), c.login);
router.post('/refresh', authLimiter, verifyOrigin, c.refresh);
router.post('/logout', verifyOrigin, c.logout);
router.post('/forgot-password', emailLimiter, validate({ body: v.forgotPasswordBody }), c.forgotPassword);
router.post('/reset-password', authLimiter, validate({ body: v.resetPasswordBody }), c.resetPassword);
router.post('/verify-email', authLimiter, validate({ body: v.verifyEmailBody }), c.verifyEmail);
router.post('/resend-verification', emailLimiter, validate({ body: v.resendVerificationBody }), c.resendVerification);

// Authenticated
router.use(authenticate);
router.get('/me', c.me);
router.patch('/me', validate({ body: v.updateProfileBody }), c.updateMe);
router.post('/change-password', authLimiter, validate({ body: v.changePasswordBody }), c.changePassword);
router.post('/logout-all', c.logoutAll);
router.get('/sessions', c.listSessions);
router.delete('/sessions/:sessionId', validate({ params: v.sessionParams }), c.revokeSessionById);
router.get('/login-history', c.loginHistory);

export default router;
