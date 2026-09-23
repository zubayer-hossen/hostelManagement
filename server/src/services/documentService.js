import { ResidentDocument } from '../models/ResidentDocument.js';
import { Resident } from '../models/Resident.js';
import { ApiError } from '../utils/ApiError.js';
import { sniffDocument } from '../utils/imageSniff.js';
import { notify } from './notificationService.js';
import { logAudit } from './auditService.js';

export const MAX_DOCUMENT_BYTES = 3 * 1024 * 1024;
const MAX_DOCUMENTS_PER_RESIDENT = 10;

const residentOf = async (userId) => {
  const r = await Resident.findOne({ user: userId }).select('_id user');
  if (!r) throw ApiError.notFound('You do not have a resident profile yet');
  return r;
};

export async function uploadOwn(user, file, { type, label }, req) {
  const resident = await residentOf(user._id);
  if (!file?.buffer?.length) throw ApiError.badRequest('No file was uploaded');
  const kind = sniffDocument(file.buffer);
  if (!kind) throw ApiError.badRequest('Only JPEG, PNG, WebP images or PDF files are allowed', { code: 'UNSUPPORTED_FILE' });
  if ((await ResidentDocument.countDocuments({ resident: resident._id })) >= MAX_DOCUMENTS_PER_RESIDENT) {
    throw ApiError.conflict(`You can keep at most ${MAX_DOCUMENTS_PER_RESIDENT} documents. Delete an old one first.`);
  }
  const doc = await ResidentDocument.create({
    resident: resident._id, user: user._id, type, label, originalName: String(file.originalname || '').slice(0, 200),
    mimeType: kind.mime, size: file.size, data: file.buffer,
  });
  await logAudit({ req, action: 'resident_document.uploaded', entity: 'ResidentDocument', entityId: doc._id, metadata: { type } });
  return doc;
}

export async function listOwn(userId) {
  const resident = await residentOf(userId);
  return ResidentDocument.find({ resident: resident._id }).sort({ createdAt: -1 });
}

/** Returns the document WITH its bytes, only if it belongs to the signed-in resident. */
export async function getOwnFile(userId, docId) {
  const doc = await ResidentDocument.findOne({ _id: docId, user: userId }).select('+data');
  if (!doc) throw ApiError.notFound('Document not found');
  return doc;
}

export async function removeOwn(userId, docId, req) {
  const doc = await ResidentDocument.findOne({ _id: docId, user: userId });
  if (!doc) throw ApiError.notFound('Document not found');
  if (doc.status === 'verified') throw ApiError.conflict('A verified document cannot be deleted. Ask the hostel office.');
  await doc.deleteOne();
  await logAudit({ req, action: 'resident_document.deleted', entity: 'ResidentDocument', entityId: doc._id });
}

// ── staff (manageResidentDocuments) ──
export const listFor = (residentId) => ResidentDocument.find({ resident: residentId }).sort({ createdAt: -1 });

export async function getFileForStaff(actor, residentId, docId, req) {
  const doc = await ResidentDocument.findOne({ _id: docId, resident: residentId }).select('+data');
  if (!doc) throw ApiError.notFound('Document not found');
  await logAudit({ req, actor, action: 'resident_document.viewed', entity: 'ResidentDocument', entityId: doc._id, metadata: { resident: String(residentId) } });
  return doc;
}

export async function review(actor, residentId, docId, { status, note }, req) {
  const doc = await ResidentDocument.findOneAndUpdate(
    { _id: docId, resident: residentId },
    { $set: { status, reviewNote: note || '', reviewedBy: actor._id, reviewedAt: new Date() } },
    { new: true }
  );
  if (!doc) throw ApiError.notFound('Document not found');
  await notify(doc.user, { type: `document.${status}`, title: `Your document was ${status}`, body: note || doc.label || doc.type, link: '/dashboard/resident/profile' });
  await logAudit({ req, action: `resident_document.${status}`, entity: 'ResidentDocument', entityId: doc._id });
  return doc;
}
