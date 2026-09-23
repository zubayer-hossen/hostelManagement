import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';
import { generateRandomToken } from '../utils/tokens.js';

export const MEETING_TYPES = ['video', 'audio', 'in_person'];

const meetingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: MEETING_TYPES, required: true },
    date: { type: String, required: true },   // local calendar date YYYY-MM-DD
    time: { type: String, required: true },   // local slot start HH:MM
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    reason: { type: String, trim: true, maxlength: 500, default: '' },
    status: { type: String, enum: ['confirmed', 'cancelled', 'completed', 'no_show'], default: 'confirmed' },
    /** Capacity guard: (slotKey, seq) is unique while the meeting is active, so a slot can never hold more than maxPerSlot. */
    slotKey: { type: String, required: true },
    seq: { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, default: true },
    /** Secret id for the audio/video room (used by the WebRTC step). Never exposed to other users. */
    roomToken: { type: String, default: () => generateRandomToken(16), select: false },
    reminderSentAt: { type: Date, default: null },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cancelReason: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

meetingSchema.index({ slotKey: 1, seq: 1 }, { unique: true, partialFilterExpression: { isActive: true } });
meetingSchema.index({ user: 1, startsAt: -1 });
meetingSchema.index({ status: 1, startsAt: 1 });
meetingSchema.index({ date: 1, status: 1 });
meetingSchema.set('toJSON', jsonTransform);

export const Meeting = mongoose.model('Meeting', meetingSchema);
