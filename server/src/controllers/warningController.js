import { asyncHandler as h } from '../utils/asyncHandler.js';
import { sendSuccess as ok } from '../utils/response.js';
import * as svc from '../services/warningService.js';

export const mine = h(async (req, res) => ok(res, { data: await svc.listMine(req.user._id) }));
export const acknowledge = h(async (req, res) => ok(res, { message: 'Warning acknowledged', data: await svc.acknowledge(req.user._id, req.params.id) }));
export const list = h(async (req, res) => { const { items, pagination } = await svc.listAll(req.query); ok(res, { data: items, meta: pagination }); });
export const issue = h(async (req, res) => ok(res, { statusCode: 201, message: 'Warning issued', data: await svc.issueWarning(req.user, req.body, req) }));
export const close = h(async (req, res) => ok(res, { message: 'Warning closed', data: await svc.close(req.user, req.params.id, req.body, req) }));
