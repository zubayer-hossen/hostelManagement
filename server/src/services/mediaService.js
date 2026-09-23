import crypto from 'node:crypto';
import { config } from '../config/env.js';
import { Media } from '../models/Media.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/sanitize.js';
import { buildPagination } from '../utils/response.js';
import { sniffImage } from '../utils/imageSniff.js';
import { getStorage } from './storage/index.js';
import { logAudit } from './auditService.js';

export async function uploadImage(user, file, { purpose = 'general', altText = '' }, req) {
  if (!file?.buffer?.length) throw ApiError.badRequest('No file was uploaded');
  const type = sniffImage(file.buffer);
  if (!type) throw ApiError.badRequest('Only JPEG, PNG, WebP or GIF images are allowed', { code: 'UNSUPPORTED_FILE' });

  const filename = `${Date.now().toString(36)}-${crypto.randomBytes(8).toString('hex')}.${type.ext}`; // never the user's file name
  const baseUrl = (config.SERVER_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const stored = await getStorage().save(file.buffer, { filename, mime: type.mime, baseUrl });

  try {
    const media = await Media.create({
      url: stored.url, storageKey: stored.key, provider: getStorage().name, originalName: String(file.originalname || '').slice(0, 200),
      mimeType: type.mime, size: file.size, purpose, altText, uploadedBy: user._id,
    });
    await logAudit({ req, action: 'media.uploaded', entity: 'Media', entityId: media._id, metadata: { size: file.size, purpose } });
    return media;
  } catch (err) {
    await getStorage().remove(stored.key); // don't leave an orphan file behind
    throw err;
  }
}

export async function listMedia({ page, limit, search, purpose }) {
  const f = { archivedAt: null };
  if (purpose) f.purpose = purpose;
  if (search) { const rx = new RegExp(escapeRegex(search), 'i'); f.$or = [{ originalName: rx }, { altText: rx }]; }
  const [items, total] = await Promise.all([
    Media.find(f).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('uploadedBy', 'name'),
    Media.countDocuments(f),
  ]);
  return { items, pagination: buildPagination({ page, limit, total }) };
}

export async function updateMedia(id, data) {
  const m = await Media.findOneAndUpdate({ _id: id, archivedAt: null }, { $set: data }, { new: true, runValidators: true });
  if (!m) throw ApiError.notFound('Media not found');
  return m;
}

/** Archive, never delete: the image may still be used by a room, banner or notice. The file stays on storage. */
export async function archiveMedia(id, req) {
  const m = await Media.findOneAndUpdate({ _id: id, archivedAt: null }, { $set: { archivedAt: new Date() } }, { new: true });
  if (!m) throw ApiError.notFound('Media not found');
  await logAudit({ req, action: 'media.archived', entity: 'Media', entityId: m._id });
  return m;
}
