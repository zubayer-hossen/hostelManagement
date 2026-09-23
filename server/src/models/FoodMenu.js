import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';

export const DAYS = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
export const MEALS = ['breakfast', 'lunch', 'snack', 'dinner'];

const foodMenuSchema = new mongoose.Schema(
  {
    hostelType: { type: String, enum: ['all', 'boys', 'girls'], default: 'all', required: true },
    day: { type: String, enum: DAYS, required: true },
    meal: { type: String, enum: MEALS, required: true },
    items: { type: [{ type: String, trim: true, maxlength: 80 }], default: [] },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    imageUrl: { type: String, trim: true, maxlength: 1000, default: '' },
    isSpecial: { type: Boolean, default: false },
    price: { type: Number, min: 0, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
foodMenuSchema.index({ hostelType: 1, day: 1, meal: 1 }, { unique: true });
foodMenuSchema.index({ isActive: 1 });
foodMenuSchema.set('toJSON', jsonTransform);

export const FoodMenu = mongoose.model('FoodMenu', foodMenuSchema);
