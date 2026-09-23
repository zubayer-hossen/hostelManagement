import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';

export const MEDIA_PURPOSES = ['general', 'banner', 'gallery', 'room', 'facility', 'food', 'notice', 'event', 'blog', 'profile'];

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, maxlength: 1000 },
    storageKey: { type: String, required: true, maxlength: 300 },
    provider: { type: String, enum: ['local', 'cloudinary'], required: true },
    originalName: { type: String, maxlength: 200, default: '' },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    purpose: { type: String, enum: MEDIA_PURPOSES, default: 'general' },
    altText: { type: String, trim: true, maxlength: 200, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

mediaSchema.index({ archivedAt: 1, createdAt: -1 });
mediaSchema.index({ purpose: 1, archivedAt: 1 });
mediaSchema.index({ storageKey: 1 }, { unique: true });
mediaSchema.set('toJSON', jsonTransform);

export const Media = mongoose.model('Media', mediaSchema);
