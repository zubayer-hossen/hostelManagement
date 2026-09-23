import mongoose from 'mongoose';

/**
 * One document per anonymous visitor per day. `visitorId` is a random id made by the browser — no IP address,
 * no name, no e-mail, no location is stored. Old days can be deleted without affecting anything else.
 */
const visitorSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, maxlength: 64 },
    day: { type: String, required: true },               // local calendar day YYYY-MM-DD
    firstSeen: { type: Date, required: true },
    lastSeen: { type: Date, required: true },
    pageviews: { type: Number, default: 0 },
    lastPath: { type: String, maxlength: 200, default: '/' },
    device: { type: String, enum: ['desktop', 'mobile', 'tablet', 'other'], default: 'other' },
    browser: { type: String, maxlength: 20, default: 'Other' },
    referrerHost: { type: String, maxlength: 100, default: '' },
  },
  { timestamps: false }
);

visitorSchema.index({ visitorId: 1, day: 1 }, { unique: true });
visitorSchema.index({ day: 1 });
visitorSchema.index({ lastSeen: -1 });

export const Visitor = mongoose.model('Visitor', visitorSchema);

/** Lets us count "all-time unique visitors" cheaply and know when counting started. */
const lifetimeSchema = new mongoose.Schema({ visitorId: { type: String, required: true, maxlength: 64 }, firstSeen: { type: Date, required: true } }, { timestamps: false });
lifetimeSchema.index({ visitorId: 1 }, { unique: true });
lifetimeSchema.index({ firstSeen: 1 });

export const VisitorLifetime = mongoose.model('VisitorLifetime', lifetimeSchema);
