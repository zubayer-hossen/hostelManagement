import { AuditLog } from '../models/AuditLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, buildPagination } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  const { page, limit, actor, entity, action } = req.query;
  const filter = {};
  if (actor) filter.actor = actor;
  if (entity) filter.entity = entity;
  if (action) filter.action = action;

  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('actor', 'name email role'),
    AuditLog.countDocuments(filter),
  ]);
  sendSuccess(res, { data: items, meta: buildPagination({ page, limit, total }) });
});
