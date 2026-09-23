import crypto from 'node:crypto';
import { config } from '../../config/env.js';

const sign = (params) =>
  crypto.createHash('sha1').update(`${Object.entries(params).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('&')}${config.CLOUDINARY_API_SECRET}`).digest('hex');

/** Cloudinary through its REST API (no SDK dependency). */
export const cloudinaryStorageProvider = {
  name: 'cloudinary',
  async save(buffer, { filename, mime }) {
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = filename.replace(/\.[^.]+$/, '');
    const folder = 'digital-hostel';
    const signature = sign({ folder, public_id: publicId, timestamp });
    const form = new FormData();
    form.append('file', new Blob([buffer], { type: mime }), filename);
    form.append('api_key', config.CLOUDINARY_API_KEY);
    form.append('timestamp', String(timestamp));
    form.append('folder', folder);
    form.append('public_id', publicId);
    form.append('signature', signature);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${config.CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: form });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Cloudinary upload failed: ${body?.error?.message || res.status}`);
    return { url: body.secure_url, key: body.public_id };
  },
  async remove(key) {
    const timestamp = Math.floor(Date.now() / 1000);
    const form = new URLSearchParams({ public_id: key, timestamp: String(timestamp), api_key: config.CLOUDINARY_API_KEY, signature: sign({ public_id: key, timestamp }) });
    await fetch(`https://api.cloudinary.com/v1_1/${config.CLOUDINARY_CLOUD_NAME}/image/destroy`, { method: 'POST', body: form }).catch(() => {});
  },
};
