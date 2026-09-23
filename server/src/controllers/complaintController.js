import { asyncHandler as h } from '../utils/asyncHandler.js';
import { sendSuccess as ok } from '../utils/response.js';
import { PERMISSIONS as P } from '../constants/permissions.js';
import * as svc from '../services/complaintService.js';

const staff = (req) => req.permissions.includes(P.MANAGE_COMPLAINTS);
const out = (c, s) => svc.serializeComplaint(c, s);

export const create = h(async (req, res) => ok(res, { statusCode: 201, message: 'Complaint submitted', data: out(await svc.createComplaint(req.user, req.body, req), false) }));
export const mine = h(async (req, res) => ok(res, { data: (await svc.listMine(req.user._id)).map((c) => out(c, false)) }));
export const getOne = h(async (req, res) => { const s = staff(req); ok(res, { data: out(await svc.getFor(req.params.id, req.user, s), s) }); });
export const reply = h(async (req, res) => ok(res, { message: 'Reply sent', data: out(await svc.reply(req.user, req.params.id, req.body.text), false) }));

export const list = h(async (req, res) => { const { items, pagination } = await svc.listAll(req.query); ok(res, { data: items.map((c) => out(c, true)), meta: pagination }); });
export const assign = h(async (req, res) => ok(res, { message: 'Assigned', data: out(await svc.assign(req.user, req.params.id, req.body.assigneeId, req), true) }));
export const setStatus = h(async (req, res) => ok(res, { message: 'Status updated', data: out(await svc.setStatus(req.user, req.params.id, req.body.status, req), true) }));
export const addNote = h(async (req, res) => ok(res, { message: 'Note added', data: out(await svc.addNote(req.user, req.params.id, req.body), true) }));
