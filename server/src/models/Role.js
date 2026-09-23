import mongoose from 'mongoose';
import { ROLE_LIST } from '../constants/roles.js';
import { PERMISSION_LIST } from '../constants/permissions.js';

const roleSchema = new mongoose.Schema(
  {
    key: { type: String, enum: ROLE_LIST, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    level: { type: Number, required: true },
    permissions: { type: [{ type: String, enum: PERMISSION_LIST }], default: [] },
  },
  { timestamps: true }
);

roleSchema.index({ key: 1 }, { unique: true });

roleSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

export const Role = mongoose.model('Role', roleSchema);
