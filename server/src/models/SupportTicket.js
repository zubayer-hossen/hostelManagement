import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from '../constants/support.js';

const messageSchema = new mongoose.Schema(
  {
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    byName: { type: String, maxlength: 80 },
    side: { type: String, enum: ['requester', 'staff'], required: true },
    text: { type: String, required: true, trim: true, maxlength: 3000 },
    internal: { type: Boolean, default: false },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = guest
    requester: {
      _id: false,
      name: { type: String, required: true, trim: true, maxlength: 80 },
      email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
      phone: { type: String, trim: true, maxlength: 20, default: '' },
    },
    category: { type: String, enum: TICKET_CATEGORIES, required: true },
    subject: { type: String, required: true, trim: true, maxlength: 140 },
    priority: { type: String, enum: TICKET_PRIORITIES, default: 'normal' },
    status: { type: String, enum: TICKET_STATUSES, default: 'open' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    messages: { type: [messageSchema], default: [] },
    /** Guests prove ownership with a secret; only its hash is stored. */
    trackingTokenHash: { type: String, select: false },
    lastActivityAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ticketSchema.index({ code: 1 }, { unique: true });
ticketSchema.index({ user: 1, createdAt: -1 });
ticketSchema.index({ status: 1, priority: 1, lastActivityAt: -1 });
ticketSchema.index({ assignedTo: 1, status: 1 });
ticketSchema.index({ category: 1, status: 1 });
ticketSchema.set('toJSON', jsonTransform);

export const SupportTicket = mongoose.model('SupportTicket', ticketSchema);
