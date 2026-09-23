import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';

export const ROOM_TYPES = ['single', 'double', 'triple', 'quad', 'dormitory'];
export const AVAILABILITY = ['available', 'almost_full', 'fully_booked', 'maintenance', 'inactive'];

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, trim: true, maxlength: 20 },
    hostelType: { type: String, enum: ['boys', 'girls'], required: true },
    floor: { type: Number, required: true, min: 0, max: 50 },
    roomType: { type: String, enum: ROOM_TYPES, required: true },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    imageUrls: { type: [{ type: String, trim: true, maxlength: 1000 }], default: [], validate: [(v) => v.length <= 10, 'At most 10 images'] },
    videoUrl: { type: String, trim: true, maxlength: 1000, default: '' },
    capacity: { type: Number, required: true, min: 1, max: 12 },
    /** Monthly price PER BED. */
    price: { type: Number, required: true, min: 0, max: 10000000 },
    sizeSqFt: { type: Number, min: 0, max: 100000, default: null },
    bathroomType: { type: String, enum: ['attached', 'shared'], default: 'shared' },
    hasAC: { type: Boolean, default: false },
    hasWifi: { type: Boolean, default: true },
    hasBalcony: { type: Boolean, default: false },
    hasStudyTable: { type: Boolean, default: true },
    hasWardrobe: { type: Boolean, default: true },
    bedType: { type: String, enum: ['single', 'bunk'], default: 'single' },
    facilities: { type: [{ type: String, trim: true, maxlength: 40 }], default: [] },

    /** Manual status set by staff. Availability shown to the public is derived from beds. */
    status: { type: String, enum: ['active', 'maintenance', 'inactive'], default: 'active' },

    /** Denormalised from Bed documents by roomService.syncRoomCounts (always recomputed, never incremented). */
    availableBeds: { type: Number, default: 0, min: 0 },
    availabilityStatus: { type: String, enum: AVAILABILITY, default: 'available' },

    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

roomSchema.index({ hostelType: 1, roomNumber: 1 }, { unique: true });
roomSchema.index({ archivedAt: 1, status: 1, hostelType: 1, price: 1 });
roomSchema.index({ availabilityStatus: 1, availableBeds: 1 });
roomSchema.set('toJSON', jsonTransform);

export const Room = mongoose.model('Room', roomSchema);
