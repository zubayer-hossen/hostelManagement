import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';

/**
 * The unit of booking. All double-booking protection rests on ONE atomic operation:
 *   Bed.findOneAndUpdate({ room, status: 'available' }, { status: 'reserved', booking })
 * MongoDB applies a single-document update atomically, so two simultaneous requests can never both win the same bed.
 */
const bedSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    label: { type: String, required: true, trim: true, maxlength: 4 },
    status: { type: String, enum: ['available', 'reserved', 'occupied', 'maintenance'], default: 'available' },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    occupant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

bedSchema.index({ room: 1, label: 1 }, { unique: true });
bedSchema.index({ room: 1, status: 1 });
bedSchema.index({ booking: 1 });
bedSchema.set('toJSON', jsonTransform);

export const Bed = mongoose.model('Bed', bedSchema);
