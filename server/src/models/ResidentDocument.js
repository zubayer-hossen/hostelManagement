import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';

export const DOCUMENT_TYPES = ['national_id', 'student_id', 'passport', 'guardian_letter', 'other'];

/**
 * Private resident document. The bytes live in MongoDB ON PURPOSE (small, capped files): they are never on a public
 * URL or a public disk, they survive hosts with ephemeral disks, and they are backed up with the database.
 * `data` is excluded from every query unless explicitly selected.
 */
const documentSchema = new mongoose.Schema(
  {
    resident: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: DOCUMENT_TYPES, required: true },
    label: { type: String, trim: true, maxlength: 80, default: '' },
    originalName: { type: String, maxlength: 200, default: '' },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true, select: false },
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

documentSchema.index({ resident: 1, createdAt: -1 });
documentSchema.set('toJSON', { ...jsonTransform, transform: (d, ret) => { delete ret.data; return jsonTransform.transform(d, ret); } });

export const ResidentDocument = mongoose.model('ResidentDocument', documentSchema);
