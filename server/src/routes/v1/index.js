import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import roleRoutes from './role.routes.js';
import settingsRoutes from './settings.routes.js';
import auditLogRoutes from './auditLog.routes.js';
import contentRoutes from './content.routes.js';
import pageRoutes from './page.routes.js';
import contactRoutes from './contact.routes.js';
import roomRoutes from './room.routes.js';
import bookingRoutes from './booking.routes.js';
import residentRoutes from './resident.routes.js';
import { duesRouter, paymentsRouter } from './finance.routes.js';
import complaintRoutes from './complaint.routes.js';
import warningRoutes from './warning.routes.js';
import notificationRoutes from './notification.routes.js';
import mediaRoutes from './media.routes.js';
import analyticsRoutes from './analytics.routes.js';
import exportRoutes from './export.routes.js';
import supportRoutes from './support.routes.js';
import meetingRoutes from './meeting.routes.js';
import trackingRoutes from './tracking.routes.js';
import blogRoutes from './blog.routes.js';
import chatbotRoutes from './chatbot.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({
    success: dbUp,
    message: dbUp ? 'OK' : 'Database not connected',
    data: { uptime: Math.round(process.uptime()), db: dbUp ? 'connected' : 'disconnected' },
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/settings', settingsRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/pages', pageRoutes);
router.use('/contact', contactRoutes);
router.use('/rooms', roomRoutes);
router.use('/bookings', bookingRoutes);
router.use('/residents', residentRoutes);
router.use('/dues', duesRouter);
router.use('/payments', paymentsRouter);
router.use('/complaints', complaintRoutes);
router.use('/warnings', warningRoutes);
router.use('/notifications', notificationRoutes);
router.use('/media', mediaRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/exports', exportRoutes);
router.use('/support', supportRoutes);
router.use('/meetings', meetingRoutes);
router.use('/track', trackingRoutes);
router.use('/blog', blogRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/', contentRoutes); // banners, headlines, facilities, food-menu, notices, faqs, gallery

export default router;
