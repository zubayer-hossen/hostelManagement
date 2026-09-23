import { ContactMessage } from '../models/ContactMessage.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, buildPagination } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import { getClientIp } from '../utils/requestMeta.js';
import { logAudit } from '../services/auditService.js';

export const submit = asyncHandler(async (req, res) => {
  const { website, ...data } = req.body;
  // Honeypot: bots fill the hidden field. Pretend success, store nothing.
  if (website) return sendSuccess(res, { statusCode: 201, message: 'Message sent. We will get back to you soon.' });

  await ContactMessage.create({ ...data, ip: getClientIp(req) });
  sendSuccess(res, { statusCode: 201, message: 'Message sent. We will get back to you soon.' });
});

export const list = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;
  const filter = status ? { status } : {};
  const [items, total] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    ContactMessage.countDocuments(filter),
  ]);
  sendSuccess(res, { data: items, meta: buildPagination({ page, limit, total }) });
});

export const setStatus = asyncHandler(async (req, res) => {
  const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { $set: { status: req.body.status } }, { new: true });
  if (!msg) throw ApiError.notFound('Message not found');
  await logAudit({ req, action: 'contactmessage.status_changed', entity: 'ContactMessage', entityId: msg._id, metadata: { status: msg.status } });
  sendSuccess(res, { message: 'Status updated', data: msg });
});
