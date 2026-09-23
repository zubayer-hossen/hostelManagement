import mongoose from 'mongoose';

const loginHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, lowercase: true, trim: true, maxlength: 254 },
    success: { type: Boolean, required: true },
    reason: { type: String, maxlength: 80 },
    ip: { type: String, maxlength: 64 },
    userAgent: { type: String, maxlength: 300 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

loginHistorySchema.index({ user: 1, createdAt: -1 });
loginHistorySchema.index({ email: 1, createdAt: -1 });

loginHistorySchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

export const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);
