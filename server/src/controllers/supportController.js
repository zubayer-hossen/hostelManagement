import { asyncHandler as h } from '../utils/asyncHandler.js';
import { sendSuccess as ok } from '../utils/response.js';
import * as svc from '../services/supportService.js';

export const create = h(async (req, res) => {
  const { website, ...data } = req.body;
  // Honeypot: bots fill the hidden field. Pretend success, store nothing.
  if (website) return ok(res, { statusCode: 201, message: 'Request received.', data: { ticket: { code: 'TKT-000000' } } });
  const { ticket, trackingToken } = await svc.createTicket(req.user ?? null, data, req);
  ok(res, { statusCode: 201, message: 'Request received. We will reply soon.', data: { ticket: svc.forRequester(ticket), trackingToken } });
});
export const track = h(async (req, res) => ok(res, { data: await svc.track(req.body) }));
export const trackReply = h(async (req, res) => ok(res, { message: 'Reply sent', data: await svc.guestReply(req.body) }));

export const mine = h(async (req, res) => ok(res, { data: (await svc.listMine(req.user._id)).map(svc.forRequester) }));
export const mineOne = h(async (req, res) => ok(res, { data: svc.forRequester(await svc.getMine(req.user._id, req.params.id)) }));
export const mineReply = h(async (req, res) => ok(res, { message: 'Reply sent', data: await svc.userReply(req.user, req.params.id, req.body.text) }));

export const list = h(async (req, res) => { const { items, pagination } = await svc.listAll(req.query); ok(res, { data: items, meta: pagination }); });
export const getOne = h(async (req, res) => ok(res, { data: await svc.getForStaff(req.params.id) }));
export const reply = h(async (req, res) => ok(res, { message: 'Saved', data: await svc.staffReply(req.user, req.params.id, req.body, req) }));
export const assign = h(async (req, res) => ok(res, { message: 'Assigned', data: await svc.assign(req.user, req.params.id, req.body.assigneeId, req) }));
export const setStatus = h(async (req, res) => ok(res, { message: 'Status updated', data: await svc.setStatus(req.user, req.params.id, req.body.status, req) }));
export const setPriority = h(async (req, res) => ok(res, { message: 'Priority updated', data: await svc.setPriority(req.user, req.params.id, req.body.priority, req) }));
