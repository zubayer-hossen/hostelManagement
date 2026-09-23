import { Resident } from '../models/Resident.js';
import { Room } from '../models/Room.js';
import { Booking } from '../models/Booking.js';
import { Due } from '../models/Due.js';
import { Payment } from '../models/Payment.js';
import { Complaint } from '../models/Complaint.js';
import { Warning } from '../models/Warning.js';
import { PERMISSIONS as P } from '../constants/permissions.js';

const MAX_ROWS = 20000;
const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const createdBetween = (q, field = 'createdAt') => (q.from || q.to ? { [field]: { ...(q.from && { $gte: q.from }), ...(q.to && { $lte: q.to }) } } : {});

/**
 * Report definitions. Each: permission, columns (header names), query(q) -> mongoose Query, row(doc) -> values.
 * Deliberately excludes sensitive personal data (no addresses, birth dates, guardians, documents).
 */
export const EXPORTS = {
  residents: {
    permission: P.MANAGE_RESIDENTS,
    columns: ['Name', 'Hostel', 'Room', 'Bed', 'Status', 'Phone', 'Email', 'Joined', 'Left', 'Monthly rent'],
    query: (q) => Resident.find({ ...(q.status && { status: q.status }), ...(q.hostelType && { hostelType: q.hostelType }), ...createdBetween(q) }).populate('room', 'roomNumber').populate('bed', 'label').sort({ fullName: 1 }),
    row: (r) => [r.fullName, r.hostelType, r.room?.roomNumber, r.bed?.label, r.status, r.phone, r.email, day(r.joiningDate), day(r.leftAt), r.monthlyRent],
  },
  rooms: {
    permission: P.MANAGE_ROOMS,
    columns: ['Room', 'Hostel', 'Floor', 'Type', 'Capacity', 'Free beds', 'Price per bed', 'Manual status', 'Availability'],
    query: (q) => Room.find({ archivedAt: null, ...(q.hostelType && { hostelType: q.hostelType }) }).sort({ hostelType: 1, roomNumber: 1 }),
    row: (r) => [r.roomNumber, r.hostelType, r.floor, r.roomType, r.capacity, r.availableBeds, r.price, r.status, r.availabilityStatus],
  },
  bookings: {
    permission: P.MANAGE_BOOKINGS,
    columns: ['Requested', 'Applicant', 'Phone', 'Hostel', 'Room', 'Status', 'Expected move-in', 'Monthly rate'],
    query: (q) => Booking.find({ ...(q.status && { status: q.status }), ...(q.hostelType && { hostelType: q.hostelType }), ...createdBetween(q) }).populate('room', 'roomNumber').sort({ createdAt: -1 }),
    row: (b) => [day(b.createdAt), b.fullName, b.phone, b.hostelType, b.room?.roomNumber, b.status, day(b.expectedMoveIn), b.monthlyRate],
  },
  dues: {
    permission: P.MANAGE_PAYMENTS,
    columns: ['Resident', 'Type', 'Month', 'Year', 'Description', 'Amount', 'Paid', 'Balance', 'Due date', 'Status'],
    query: (q) => Due.find({ ...(q.status && { status: q.status }), ...createdBetween(q, 'dueDate') }).populate('resident', 'fullName').sort({ year: -1, month: -1 }),
    row: (d) => [d.resident?.fullName, d.type, d.month, d.year, d.description, d.amount, d.paidAmount, d.balance, day(d.dueDate), d.status],
  },
  payments: {
    permission: P.MANAGE_PAYMENTS,
    columns: ['Receipt', 'Date', 'Resident', 'Amount', 'Method', 'Transaction ID', 'Status'],
    query: (q) => Payment.find({ ...(q.status && { status: q.status }), ...createdBetween(q, 'paidAt') }).populate('resident', 'fullName').sort({ paidAt: -1 }),
    row: (p) => [p.receiptNo, day(p.paidAt), p.resident?.fullName, p.amount, p.method, p.transactionId, p.status],
  },
  complaints: {
    permission: P.MANAGE_COMPLAINTS,
    columns: ['Code', 'Created', 'Resident', 'Category', 'Priority', 'Status', 'Subject', 'Resolved'],
    query: (q) => Complaint.find({ ...(q.status && { status: q.status }), ...createdBetween(q) }).populate('resident', 'fullName').sort({ createdAt: -1 }),
    row: (c) => [c.code, day(c.createdAt), c.resident?.fullName, c.category, c.priority, c.status, c.subject, day(c.resolvedAt)],
  },
  warnings: {
    permission: P.MANAGE_RESIDENTS,
    columns: ['Date', 'Resident', 'Type', 'Severity', 'Status', 'Reason'],
    query: (q) => Warning.find({ ...(q.status && { status: q.status }), ...createdBetween(q) }).populate('resident', 'fullName').sort({ createdAt: -1 }),
    row: (w) => [day(w.createdAt), w.resident?.fullName, w.type, w.severity, w.status, w.reason],
  },
};

export { MAX_ROWS };
