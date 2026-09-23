import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';
import { BOOKING_STATUS_LIST, BOOKING_STATUS, isActiveStatus } from '../constants/booking.js';

const noteSchema = new mongoose.Schema(
  {
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    byName: { type: String, maxlength: 80 },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    bed: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed', default: null },
    hostelType: { type: String, enum: ['boys', 'girls'], required: true },
    status: { type: String, enum: BOOKING_STATUS_LIST, default: BOOKING_STATUS.PENDING },
    /** true while the booking holds a bed; used by the partial unique index below. Maintained automatically. */
    isActiveHold: { type: Boolean, default: true },

    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
    gender: { type: String, enum: ['male', 'female'], required: true },
    occupation: { type: String, trim: true, maxlength: 80, default: '' },
    institution: { type: String, trim: true, maxlength: 120, default: '' },
    expectedMoveIn: { type: Date, required: true },
    notes: { type: String, trim: true, maxlength: 500, default: '' },

    /** Price per month at the time of the request (later phases bill from this). */
    monthlyRate: { type: Number, required: true, min: 0 },
    holdExpiresAt: { type: Date, default: null },

    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decidedAt: { type: Date, default: null },
    decisionReason: { type: String, trim: true, maxlength: 500, default: '' },
    movedInAt: { type: Date, default: null },
    movedOutAt: { type: Date, default: null },

    internalNotes: { type: [noteSchema], default: [] },
  },
  { timestamps: true }
);

bookingSchema.pre('validate', function setActiveFlag(next) {
  this.isActiveHold = isActiveStatus(this.status);
  next();
});

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ room: 1, status: 1 });
bookingSchema.index({ status: 1, holdExpiresAt: 1 });
// A user can hold at most one active booking per room — enforced by the database, not just by application code.
bookingSchema.index({ user: 1, room: 1 }, { unique: true, partialFilterExpression: { isActiveHold: true } });
bookingSchema.set('toJSON', jsonTransform);

export const Booking = mongoose.model('Booking', bookingSchema);
