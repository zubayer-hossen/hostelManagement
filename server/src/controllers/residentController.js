import { asyncHandler as h } from '../utils/asyncHandler.js';
import { sendSuccess as ok } from '../utils/response.js';
import * as svc from '../services/residentService.js';
import * as docs from '../services/documentService.js';
import { logAudit } from '../services/auditService.js';

// resident (self)
export const me = h(async (req, res) => ok(res, { data: await svc.getMine(req.user._id) }));
export const updateMe = h(async (req, res) => ok(res, { message: 'Profile saved', data: await svc.updateMine(req.user._id, req.body) }));
export const acknowledgeRules = h(async (req, res) => { await svc.acknowledgeRules(req.user._id); ok(res, { message: 'Thank you for acknowledging the rules' }); });
export const notices = h(async (req, res) => ok(res, { data: await svc.residentNotices(req.user._id) }));
export const requestMoveOut = h(async (req, res) => {
  const r = await svc.requestMoveOut(req.user._id, req.body);
  await logAudit({ req, action: 'resident.moveout_requested', entity: 'Resident', entityId: r._id });
  ok(res, { statusCode: 201, message: 'Move-out request sent', data: r.moveOut });
});

// staff (manageResidents)
export const list = h(async (req, res) => { const { items, pagination } = await svc.listResidents(req.query); ok(res, { data: items, meta: pagination }); });
export const getOne = h(async (req, res) => ok(res, { data: await svc.getResident(req.params.id) }));
export const verify = h(async (req, res) => ok(res, { message: 'Resident updated', data: await svc.verify(req.user, req.params.id, req.body, req) }));
export const transfer = h(async (req, res) => ok(res, { message: 'Resident transferred', data: await svc.transfer(req.user, req.params.id, req.body, req) }));
export const decideMoveOut = h(async (req, res) => ok(res, { message: 'Decision saved', data: await svc.decideMoveOut(req.user, req.params.id, req.body, req) }));

// ── documents ──

const sendFile = (res, doc, download) => {
  res.set({
    'Content-Type': doc.mimeType,
    'Content-Length': String(doc.data.length),
    'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="document-${doc.id}.${doc.mimeType === 'application/pdf' ? 'pdf' : doc.mimeType.split('/')[1]}"`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
  });
  res.send(doc.data);
};
export const myDocuments = h(async (req, res) => ok(res, { data: await docs.listOwn(req.user._id) }));
export const uploadDocument = h(async (req, res) => ok(res, { statusCode: 201, message: 'Document uploaded', data: await docs.uploadOwn(req.user, req.file, req.body, req) }));
export const deleteDocument = h(async (req, res) => { await docs.removeOwn(req.user._id, req.params.docId, req); ok(res, { message: 'Document deleted' }); });
export const myDocumentFile = h(async (req, res) => sendFile(res, await docs.getOwnFile(req.user._id, req.params.docId), req.query.download === '1'));
export const residentDocuments = h(async (req, res) => ok(res, { data: await docs.listFor(req.params.id) }));
export const residentDocumentFile = h(async (req, res) => sendFile(res, await docs.getFileForStaff(req.user, req.params.id, req.params.docId, req), req.query.download === '1'));
export const reviewDocument = h(async (req, res) => ok(res, { message: 'Document reviewed', data: await docs.review(req.user, req.params.id, req.params.docId, req.body, req) }));
