import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';
import { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES } from '../constants/resident.js';

const noteSchema = new mongoose.Schema(
  {
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    byName: { type: String, maxlength: 80 },
    text: { type: String, required: true, trim: true, maxlength: 1500 },
    internal: { type: Boolean, default: false },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    resident: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, enum: COMPLAINT_CATEGORIES, required: true },
    subject: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    status: { type: String, enum: COMPLAINT_STATUSES, default: 'open' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: [noteSchema], default: [] },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

complaintSchema.index({ code: 1 }, { unique: true });
complaintSchema.index({ resident: 1, createdAt: -1 });
complaintSchema.index({ status: 1, priority: 1, createdAt: -1 });
complaintSchema.index({ category: 1, status: 1 });
complaintSchema.set('toJSON', jsonTransform);

export const Complaint = mongoose.model('Complaint', complaintSchema);
