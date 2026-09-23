import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    subject: { type: String, trim: true, maxlength: 140, default: '' },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    status: { type: String, enum: ['new', 'read', 'resolved'], default: 'new' },
    ip: { type: String, maxlength: 64 },
  },
  { timestamps: true }
);
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.set('toJSON', jsonTransform);

export const ContactMessage = mongoose.model('ContactMessage', contactSchema);
