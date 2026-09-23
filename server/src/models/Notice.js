import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';

export const NOTICE_AUDIENCES = ['everyone', 'boys', 'girls', 'residents', 'staff', 'admins'];

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, trim: true, maxlength: 5000, default: '' },
    imageUrl: { type: String, trim: true, maxlength: 1000, default: '' },
    attachmentUrl: { type: String, trim: true, maxlength: 1000, default: '' },
    priority: { type: String, enum: ['normal', 'important', 'urgent'], default: 'normal' },
    audience: { type: String, enum: NOTICE_AUDIENCES, default: 'everyone' },
    isPinned: { type: Boolean, default: false },
    publishAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
noticeSchema.index({ isActive: 1, audience: 1, isPinned: -1, publishAt: -1 });
noticeSchema.set('toJSON', jsonTransform);

export const Notice = mongoose.model('Notice', noticeSchema);
