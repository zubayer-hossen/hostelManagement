import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';

export const GALLERY_CATEGORIES = ['hostel', 'boys', 'girls', 'events', 'food', 'educational_tour', 'functions', 'sports', 'facilities'];

const gallerySchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 120, default: '' },
    description: { type: String, trim: true, maxlength: 400, default: '' },
    imageUrl: { type: String, required: true, trim: true, maxlength: 1000 },
    category: { type: String, enum: GALLERY_CATEGORIES, default: 'hostel' },
    date: { type: Date, default: null },
    isFeatured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
gallerySchema.index({ isActive: 1, category: 1, order: 1 });
gallerySchema.set('toJSON', jsonTransform);

export const GalleryItem = mongoose.model('GalleryItem', gallerySchema);
