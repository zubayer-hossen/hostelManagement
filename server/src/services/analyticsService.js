import { Resident } from '../models/Resident.js';
import { Room } from '../models/Room.js';
import { Bed } from '../models/Bed.js';
import { Booking } from '../models/Booking.js';
import { Complaint } from '../models/Complaint.js';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { getSummary } from './financeService.js';
import { round2 } from '../utils/money.js';

const toMap = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.count]));

/** Real numbers only — everything below is computed from the database. Visitor analytics come in Phase 7. */
export async function getOverview() {
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 864e5);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [byHostel, beds, rooms, bookings, complaints, newUsers, finance, monthly] = await Promise.all([
    Resident.aggregate([{ $match: { room: { $ne: null }, status: { $in: ['pending', 'verified', 'suspended'] } } }, { $group: { _id: '$hostelType', count: { $sum: 1 } } }]),
    Bed.aggregate([
      { $lookup: { from: 'rooms', localField: 'room', foreignField: '_id', as: 'r' } }, { $unwind: '$r' }, { $match: { 'r.archivedAt': null } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Room.aggregate([{ $match: { archivedAt: null } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    User.countDocuments({ deletedAt: null, createdAt: { $gte: since30 } }),
    getSummary(),
    Payment.aggregate([{ $match: { status: 'recorded', paidAt: { $gte: sixMonthsAgo } } }, { $group: { _id: { y: { $year: '$paidAt' }, m: { $month: '$paidAt' } }, total: { $sum: '$amount' } } }]),
  ]);

  const h = toMap(byHostel);
  const b = toMap(beds);
  const totalBeds = Object.values(b).reduce((s, n) => s + n, 0);
  const usable = totalBeds - (b.maintenance || 0);
  const taken = (b.occupied || 0) + (b.reserved || 0);

  const monthlyCollection = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const hit = monthly.find((m) => m._id.y === d.getFullYear() && m._id.m === d.getMonth() + 1);
    monthlyCollection.push({ label: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, total: round2(hit?.total ?? 0) });
  }

  const bk = toMap(bookings);
  const cp = toMap(complaints);
  return {
    residents: { total: (h.boys || 0) + (h.girls || 0), boys: h.boys || 0, girls: h.girls || 0 },
    rooms: { total: Object.values(toMap(rooms)).reduce((s, n) => s + n, 0), byStatus: toMap(rooms) },
    beds: { total: totalBeds, available: b.available || 0, occupied: b.occupied || 0, reserved: b.reserved || 0, maintenance: b.maintenance || 0, occupancyRate: usable > 0 ? Math.round((taken / usable) * 100) : 0 },
    bookings: { byStatus: bk, pending: bk.pending || 0 },
    complaints: { byStatus: cp, open: (cp.open || 0) + (cp.assigned || 0) + (cp.in_progress || 0) },
    newUsers30Days: newUsers,
    finance,
    monthlyCollection,
  };
}
