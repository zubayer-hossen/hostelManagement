import { Router } from 'express';
import * as c from '../../controllers/supportController.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, optionalAuth, requirePermission } from '../../middleware/auth.js';
import { contactLimiter, trackLimiter } from '../../middleware/rateLimiter.js';
import { PERMISSIONS as P } from '../../constants/permissions.js';
import { idParams } from '../../validations/common.js';
import * as v from '../../validations/support.validation.js';

const router = Router();
const staff = requirePermission(P.MANAGE_SUPPORT);

// Public (guests and signed-in users)
router.post('/', contactLimiter, optionalAuth, validate({ body: v.createTicketBody }), c.create);
router.post('/track', trackLimiter, validate({ body: v.trackBody }), c.track);
router.post('/track/reply', trackLimiter, validate({ body: v.trackReplyBody }), c.trackReply);

// Signed-in requester (before "/:id")
router.get('/mine', authenticate, c.mine);
router.get('/mine/:id', authenticate, validate({ params: idParams }), c.mineOne);
router.post('/mine/:id/reply', authenticate, validate({ params: idParams, body: v.replyBody }), c.mineReply);

// Staff
router.get('/', authenticate, staff, validate({ query: v.listTicketsQuery }), c.list);
router.get('/:id', authenticate, staff, validate({ params: idParams }), c.getOne);
router.post('/:id/reply', authenticate, staff, validate({ params: idParams, body: v.replyBody }), c.reply);
router.post('/:id/assign', authenticate, staff, validate({ params: idParams, body: v.assignTicketBody }), c.assign);
router.patch('/:id/status', authenticate, staff, validate({ params: idParams, body: v.ticketStatusBody }), c.setStatus);
router.patch('/:id/priority', authenticate, staff, validate({ params: idParams, body: v.ticketPriorityBody }), c.setPriority);

export default router;
