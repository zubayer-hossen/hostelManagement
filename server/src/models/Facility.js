import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';

const facilitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 400, default: '' },
    icon: { type: String, trim: true, maxlength: 30, default: 'sparkles' },
    imageUrl: { type: String, trim: true, maxlength: 1000, default: '' },
    hostelType: { type: String, enum: ['all', 'boys', 'girls'], default: 'all' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
facilitySchema.index({ isActive: 1, hostelType: 1, order: 1 });
facilitySchema.set('toJSON', jsonTransform);

export const Facility = mongoose.model('Facility', facilitySchema);
