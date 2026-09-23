import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';
import { RESIDENT_STATUS, MOVE_OUT } from '../constants/resident.js';

const s = (max) => ({ type: String, trim: true, maxlength: max, default: '' });
const contact = { _id: false, name: s(80), phone: s(20), relation: s(40) };

/** Private record of a person living (or who lived) in the hostel. Never exposed publicly. */
const residentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: Object.values(RESIDENT_STATUS), default: RESIDENT_STATUS.PENDING },
    hostelType: { type: String, enum: ['boys', 'girls'], required: true },

    // current stay (cleared at move-out)
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
    bed: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed', default: null },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    monthlyRent: { type: Number, min: 0, default: 0 },
    joiningDate: { type: Date, default: null },
    expectedLeavingDate: { type: Date, default: null },
    leftAt: { type: Date, default: null },

    // biodata (which are required is configured in Settings)
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    photoUrl: s(1000),
    fatherName: s(80),
    motherName: s(80),
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: ['male', 'female'], required: true },
    phone: s(20),
    email: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
    emergencyContact: contact,
    guardian: contact,
    permanentAddress: s(400),
    presentAddress: s(400),
    nationality: s(60),
    occupation: s(80),
    institution: s(120),
    department: s(80),
    bloodGroup: { type: String, enum: ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], default: '' },
    notes: s(1000),
    profileCompleted: { type: Boolean, default: false },

    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedAt: { type: Date, default: null },
    verificationNote: s(500),
    rulesAcknowledgedAt: { type: Date, default: null },

    moveOut: {
      _id: false,
      status: { type: String, enum: Object.values(MOVE_OUT), default: MOVE_OUT.NONE },
      requestedAt: { type: Date, default: null },
      requestedDate: { type: Date, default: null },
      reason: s(500),
      decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      decidedAt: { type: Date, default: null },
      decisionNote: s(500),
      completedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

residentSchema.index({ user: 1 }, { unique: true });
residentSchema.index({ status: 1, hostelType: 1, createdAt: -1 });
residentSchema.index({ room: 1 });
residentSchema.index({ fullName: 1 });
residentSchema.set('toJSON', jsonTransform);

export const Resident = mongoose.model('Resident', residentSchema);
