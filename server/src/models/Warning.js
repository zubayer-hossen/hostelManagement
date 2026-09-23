import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';
import { WARNING_TYPES } from '../constants/resident.js';

/** Issued only by authorised staff. Nothing in the system issues or acts on a warning automatically. */
const warningSchema = new mongoose.Schema(
  {
    resident: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: WARNING_TYPES, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    reason: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'acknowledged', 'resolved', 'withdrawn'], default: 'active' },
    acknowledgedAt: { type: Date, default: null },
    resolutionNote: { type: String, trim: true, maxlength: 500, default: '' },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

warningSchema.index({ resident: 1, createdAt: -1 });
warningSchema.index({ status: 1, severity: 1, createdAt: -1 });
warningSchema.set('toJSON', jsonTransform);

export const Warning = mongoose.model('Warning', warningSchema);
