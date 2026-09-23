import { asyncHandler as h } from '../utils/asyncHandler.js';
import { sendSuccess as ok } from '../utils/response.js';
import * as svc from '../services/financeService.js';

export const listDues = h(async (req, res) => { const { items, pagination } = await svc.listDues(req.query); ok(res, { data: items, meta: pagination }); });
export const myDues = h(async (req, res) => ok(res, { data: await svc.listMyDues(req.user._id) }));
export const summary = h(async (_req, res) => ok(res, { data: await svc.getSummary() }));
export const generate = h(async (req, res) => ok(res, { statusCode: 201, message: 'Rent generated', data: await svc.generateRent(req.user, req.body, req) }));
export const createDue = h(async (req, res) => ok(res, { statusCode: 201, message: 'Due created', data: await svc.createDue(req.user, req.body, req) }));
export const voidDue = h(async (req, res) => ok(res, { message: 'Due voided', data: await svc.voidDue(req.user, req.params.id, req.body.reason, req) }));

export const listPayments = h(async (req, res) => { const { items, pagination } = await svc.listPayments(req.query); ok(res, { data: items, meta: pagination }); });
export const myPayments = h(async (req, res) => ok(res, { data: await svc.listMyPayments(req.user._id) }));
export const record = h(async (req, res) => ok(res, { statusCode: 201, message: 'Payment recorded', data: await svc.recordPayment(req.user, req.body, req) }));
export const voidPayment = h(async (req, res) => ok(res, { message: 'Payment voided', data: await svc.voidPayment(req.user, req.params.id, req.body.reason, req) }));
