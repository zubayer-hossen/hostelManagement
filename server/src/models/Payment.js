import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';
import { PAYMENT_METHODS } from '../constants/resident.js';

/** A recorded payment. Never deleted: voiding keeps the record and reverses its effect on the due. No card data is ever stored. */
const paymentSchema = new mongoose.Schema(
  {
    receiptNo: { type: String, required: true },
    due: { type: mongoose.Schema.Types.ObjectId, ref: 'Due', required: true },
    resident: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    provider: { type: String, default: 'manual', maxlength: 30 },
    transactionId: { type: String, trim: true, maxlength: 80, default: '' },
    paidAt: { type: Date, default: Date.now },
    note: { type: String, trim: true, maxlength: 300, default: '' },
    status: { type: String, enum: ['recorded', 'voided'], default: 'recorded' },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    voidedAt: { type: Date, default: null },
    voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    voidReason: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

paymentSchema.index({ receiptNo: 1 }, { unique: true });
paymentSchema.index({ resident: 1, paidAt: -1 });
paymentSchema.index({ due: 1 });
paymentSchema.index({ paidAt: -1 });
paymentSchema.set('toJSON', jsonTransform);

export const Payment = mongoose.model('Payment', paymentSchema);
