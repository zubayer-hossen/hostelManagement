import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 3000, default: '' },
    imageUrl: { type: String, trim: true, maxlength: 1000, default: '' },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, default: null },
    location: { type: String, trim: true, maxlength: 200, default: '' },
    organizer: { type: String, trim: true, maxlength: 120, default: '' },
    registrationLink: { type: String, trim: true, maxlength: 500, default: '' },
    status: { type: String, enum: ['scheduled', 'cancelled', 'completed'], default: 'scheduled' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

eventSchema.index({ isActive: 1, startsAt: 1 });
eventSchema.set('toJSON', jsonTransform);

export const Event = mongoose.model('Event', eventSchema);
