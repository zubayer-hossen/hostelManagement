import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';
import { DUE_TYPES } from '../constants/resident.js';

/** Money a resident owes. Never deleted: void it (with a reason) instead. */
const dueSchema = new mongoose.Schema(
  {
    resident: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: DUE_TYPES, default: 'rent' },
    month: { type: Number, min: 1, max: 12, required: true },
    year: { type: Number, min: 2000, max: 2100, required: true },
    description: { type: String, trim: true, maxlength: 200, default: '' },
    /** Positive = charge. Adjustments are separate dues, so history is never rewritten. */
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['due', 'partially_paid', 'paid', 'overdue', 'void'], default: 'due' },
    isVoid: { type: Boolean, default: false },
    voidedAt: { type: Date, default: null },
    voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    voidReason: { type: String, trim: true, maxlength: 300, default: '' },
    lastReminderAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

dueSchema.index({ resident: 1, year: -1, month: -1 });
dueSchema.index({ status: 1, dueDate: 1 });
dueSchema.index({ user: 1, createdAt: -1 });
// One live rent due per resident per month — generating rent twice cannot create duplicates.
dueSchema.index({ resident: 1, type: 1, month: 1, year: 1 }, { unique: true, partialFilterExpression: { type: 'rent', isVoid: false } });
dueSchema.virtual('balance').get(function balance() { return this.isVoid ? 0 : Math.max(0, this.amount - this.paidAmount); });
dueSchema.set('toJSON', { ...jsonTransform, virtuals: true });

export const Due = mongoose.model('Due', dueSchema);
