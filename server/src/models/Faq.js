import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 300 },
    answer: { type: String, required: true, trim: true, maxlength: 3000 },
    category: { type: String, trim: true, maxlength: 60, default: 'General' },
    order: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
faqSchema.index({ isActive: 1, category: 1, order: 1 });
faqSchema.set('toJSON', jsonTransform);

export const Faq = mongoose.model('Faq', faqSchema);
