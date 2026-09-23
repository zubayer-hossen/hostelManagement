import { asyncHandler as h } from '../utils/asyncHandler.js';
import { sendSuccess as ok } from '../utils/response.js';
import { PERMISSIONS as P } from '../constants/permissions.js';
import * as svc from '../services/meetingService.js';

export const config = h(async (_req, res) => { res.set('Cache-Control', 'public, max-age=30'); ok(res, { data: await svc.getConfig() }); });
export const availability = h(async (req, res) => ok(res, { data: await svc.getAvailability(req.query.date) }));
export const create = h(async (req, res) => ok(res, { statusCode: 201, message: 'Meeting booked', data: await svc.createMeeting(req.user, req.body, req) }));
export const mine = h(async (req, res) => ok(res, { data: await svc.listMine(req.user._id) }));
export const cancel = h(async (req, res) => ok(res, { message: 'Meeting cancelled', data: await svc.cancel(req.user, req.params.id, req.body.reason, req, req.permissions.includes(P.MANAGE_MEETINGS)) }));
export const list = h(async (req, res) => { const { items, pagination } = await svc.listAll(req.query); ok(res, { data: items, meta: pagination }); });
export const outcome = h(async (req, res) => ok(res, { message: 'Meeting updated', data: await svc.setOutcome(req.user, req.params.id, req.body.status, req) }));
