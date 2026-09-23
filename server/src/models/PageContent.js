import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';

export const PAGE_KEYS = ['about', 'boys', 'girls', 'rules', 'terms', 'privacy'];

/** Editable long-form pages. Content is plain text with light markdown (## headings, - bullets), rendered safely by the client. */
const pageSchema = new mongoose.Schema(
  {
    key: { type: String, enum: PAGE_KEYS, required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    content: { type: String, trim: true, maxlength: 50000, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);
pageSchema.index({ key: 1 }, { unique: true });
pageSchema.set('toJSON', jsonTransform);

export const PageContent = mongoose.model('PageContent', pageSchema);
