import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';

/** Permanent history of who slept in which bed and when. Never deleted. */
const occupancySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    bed: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    endReason: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

occupancySchema.index({ bed: 1, endDate: 1 });
occupancySchema.index({ user: 1, startDate: -1 });
occupancySchema.index({ booking: 1 });
occupancySchema.set('toJSON', jsonTransform);

export const OccupancyRecord = mongoose.model('OccupancyRecord', occupancySchema);
