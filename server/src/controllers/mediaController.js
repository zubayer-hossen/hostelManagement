import { asyncHandler as h } from '../utils/asyncHandler.js';
import { sendSuccess as ok } from '../utils/response.js';
import * as svc from '../services/mediaService.js';

export const upload = h(async (req, res) => ok(res, { statusCode: 201, message: 'Image uploaded', data: await svc.uploadImage(req.user, req.file, req.body, req) }));
export const list = h(async (req, res) => { const { items, pagination } = await svc.listMedia(req.query); ok(res, { data: items, meta: pagination }); });
export const update = h(async (req, res) => ok(res, { message: 'Saved', data: await svc.updateMedia(req.params.id, req.body) }));
export const archive = h(async (req, res) => { await svc.archiveMedia(req.params.id, req); ok(res, { message: 'Image archived' }); });
