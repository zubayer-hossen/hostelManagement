import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true, maxlength: 40 }, // booking.approved, warning.issued, payment.received …
    title: { type: String, required: true, maxlength: 140 },
    body: { type: String, maxlength: 500, default: '' },
    link: { type: String, maxlength: 300, default: '' },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });
notificationSchema.set('toJSON', jsonTransform);

export const Notification = mongoose.model('Notification', notificationSchema);
