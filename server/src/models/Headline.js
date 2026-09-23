import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';

const headlineSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 200 },
    link: { type: String, trim: true, maxlength: 500, default: '' },
    priority: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true }
);
headlineSchema.index({ isActive: 1, priority: -1 });
headlineSchema.set('toJSON', jsonTransform);

export const Headline = mongoose.model('Headline', headlineSchema);
