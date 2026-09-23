import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { PERMISSIONS as P } from '../constants/permissions.js';
import * as svc from '../services/bookingService.js';

const isStaff = (req) => req.permissions.includes(P.MANAGE_BOOKINGS);
const out = (b, staff) => svc.serializeBooking(b, { staff });

export const create = asyncHandler(async (req, res) => {
  const booking = await svc.createBooking(req.user, req.body, req);
  sendSuccess(res, { statusCode: 201, message: 'Room request submitted. We will review it shortly.', data: out(booking, false) });
});

export const mine = asyncHandler(async (req, res) => {
  const items = await svc.listMyBookings(req.user._id);
  sendSuccess(res, { data: items.map((b) => out(b, false)) });
});

export const getOne = asyncHandler(async (req, res) => {
  const staff = isStaff(req);
  sendSuccess(res, { data: out(await svc.getBookingFor(req.params.id, req.user, staff), staff) });
});

export const cancel = asyncHandler(async (req, res) => {
  const staff = isStaff(req);
  const b = await svc.cancel(req.user, req.params.id, req.body.reason, req, staff);
  sendSuccess(res, { message: 'Booking cancelled', data: out(b, staff) });
});

// ── staff only (route-level manageBookings) ──
export const list = asyncHandler(async (req, res) => {
  const { items, pagination } = await svc.listBookings(req.query);
  sendSuccess(res, { data: items.map((b) => out(b, true)), meta: pagination });
});
export const approve = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Booking approved', data: out(await svc.approve(req.user, req.params.id, req.body.reason, req), true) }));
export const reject = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Booking rejected', data: out(await svc.reject(req.user, req.params.id, req.body.reason, req), true) }));
export const hold = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Booking put on hold', data: out(await svc.hold(req.user, req.params.id, req.body.reason, req), true) }));
export const addNote = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Note added', data: out(await svc.addNote(req.user, req.params.id, req.body.text), true) }));
export const assignBed = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Bed assigned', data: out(await svc.assignBed(req.user, req.params.id, req.body.bedId, req), true) }));
export const checkIn = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Resident moved in', data: out(await svc.checkIn(req.user, req.params.id, req.body.date, req), true) }));
export const checkOut = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Resident moved out', data: out(await svc.checkOut(req.user, req.params.id, req.body, req), true) }));
