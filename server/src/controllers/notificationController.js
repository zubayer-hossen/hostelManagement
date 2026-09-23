import { asyncHandler as h } from '../utils/asyncHandler.js';
import { sendSuccess as ok } from '../utils/response.js';
import * as svc from '../services/notificationService.js';

export const list = h(async (req, res) => { const { items, meta } = await svc.listNotifications(req.user._id, req.query); ok(res, { data: items, meta }); });
export const read = h(async (req, res) => ok(res, { data: await svc.markRead(req.user._id, req.params.id) }));
export const readAll = h(async (req, res) => { await svc.markAllRead(req.user._id); ok(res, { message: 'All notifications marked as read' }); });
