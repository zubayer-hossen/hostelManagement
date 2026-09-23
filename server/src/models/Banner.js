import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';

const s = (max) => ({ type: String, trim: true, maxlength: max, default: '' });

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    subtitle: s(200),
    description: s(600),
    imageUrl: s(1000),
    videoUrl: s(1000),
    ctaText: s(40),
    ctaLink: s(500),
    secondaryCtaText: s(40),
    secondaryCtaLink: s(500),
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true }
);
bannerSchema.index({ isActive: 1, order: 1 });
bannerSchema.set('toJSON', jsonTransform);

export const Banner = mongoose.model('Banner', bannerSchema);
