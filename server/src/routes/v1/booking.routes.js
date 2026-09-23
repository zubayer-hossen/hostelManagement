import { Router } from 'express';
import * as c from '../../controllers/bookingController.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import { PERMISSIONS as P } from '../../constants/permissions.js';
import * as v from '../../validations/booking.validation.js';

const router = Router();
const staff = requirePermission(P.MANAGE_BOOKINGS);
const idOnly = validate({ params: v.bookingIdParams });

router.use(authenticate);

// Any signed-in user
router.post('/', authLimiter, validate({ body: v.createBookingBody }), c.create);
router.get('/mine', c.mine);

// Staff list (must come before "/:id")
router.get('/', staff, validate({ query: v.listBookingsQuery }), c.list);

// Owner or staff (the service checks ownership)
router.get('/:id', idOnly, c.getOne);
router.post('/:id/cancel', validate({ params: v.bookingIdParams, body: v.decisionBody }), c.cancel);

// Staff only
router.post('/:id/approve', staff, validate({ params: v.bookingIdParams, body: v.decisionBody }), c.approve);
router.post('/:id/reject', staff, validate({ params: v.bookingIdParams, body: v.decisionBody }), c.reject);
router.post('/:id/hold', staff, validate({ params: v.bookingIdParams, body: v.decisionBody }), c.hold);
router.post('/:id/notes', staff, validate({ params: v.bookingIdParams, body: v.noteBody }), c.addNote);
router.patch('/:id/bed', staff, validate({ params: v.bookingIdParams, body: v.assignBedBody }), c.assignBed);
router.post('/:id/check-in', staff, validate({ params: v.bookingIdParams, body: v.checkInBody }), c.checkIn);
router.post('/:id/check-out', staff, validate({ params: v.bookingIdParams, body: v.checkOutBody }), c.checkOut);

export default router;
