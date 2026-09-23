import mongoose from 'mongoose';

/**
 * One document per logged-in device. The refresh token itself is never stored,
 * only the SHA-256 hash of its `jti`. `previousJtiHash` lets us detect refresh-token reuse.
 */
const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    currentJtiHash: { type: String, required: true },
    previousJtiHash: { type: String },
    userAgent: { type: String, maxlength: 300 },
    ip: { type: String, maxlength: 64 },
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, maxlength: 60 },
  },
  { timestamps: true }
);

sessionSchema.index({ user: 1, revokedAt: 1, expiresAt: -1 });
// MongoDB removes expired session documents automatically (safe: expired sessions are useless).
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

sessionSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.currentJtiHash;
    delete ret.previousJtiHash;
    return ret;
  },
});

export const Session = mongoose.model('Session', sessionSchema);
