import { Room } from '../models/Room.js';
import { Bed } from '../models/Bed.js';
import { Booking } from '../models/Booking.js';
import { Favorite } from '../models/Favorite.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/sanitize.js';
import { buildPagination } from '../utils/response.js';
import { bedLabel, publicBedStatus } from '../utils/roomUtils.js';
import { expireStaleBookings } from './bookingMaintenance.js';
import { syncRoomCounts } from './bedService.js';

export { syncRoomCounts };

const SORTS = {
  price: { price: 1 }, '-price': { price: -1 }, floor: { floor: 1, roomNumber: 1 }, '-floor': { floor: -1, roomNumber: 1 },
  capacity: { capacity: 1 }, '-capacity': { capacity: -1 }, newest: { createdAt: -1 }, roomNumber: { roomNumber: 1 },
};

function buildFilter(q, { staff }) {
  const f = {};
  if (!staff) Object.assign(f, { archivedAt: null, status: { $ne: 'inactive' } });
  else {
    if (!q.includeArchived) f.archivedAt = null;
    if (q.status) f.status = q.status;
  }
  if (q.hostelType) f.hostelType = q.hostelType;
  if (q.roomType) f.roomType = q.roomType;
  if (q.floor !== undefined) f.floor = q.floor;
  if (q.capacity) f.capacity = q.capacity;
  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    f.price = {};
    if (q.minPrice !== undefined) f.price.$gte = q.minPrice;
    if (q.maxPrice !== undefined) f.price.$lte = q.maxPrice;
  }
  if (q.ac !== undefined) f.hasAC = q.ac;
  if (q.wifi !== undefined) f.hasWifi = q.wifi;
  if (q.attachedBathroom === true) f.bathroomType = 'attached';
  if (q.availability === 'available') { f.availableBeds = { $gt: 0 }; f.status = 'active'; }
  else if (q.availability) f.availabilityStatus = q.availability;
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), 'i');
    f.$or = [{ roomNumber: rx }, { description: rx }, { facilities: rx }];
  }
  return f;
}

export async function listRooms(query, { staff = false } = {}) {
  await expireStaleBookings();
  const filter = buildFilter(query, { staff });
  const { page, limit } = query;
  const [items, total] = await Promise.all([
    Room.find(filter).sort(SORTS[query.sort] || SORTS.roomNumber).skip((page - 1) * limit).limit(limit),
    Room.countDocuments(filter),
  ]);
  return { items, pagination: buildPagination({ page, limit, total }) };
}

/** Public detail: beds are shown only as available / booked / maintenance — never who holds them. */
export async function getPublicRoom(id) {
  await expireStaleBookings();
  const room = await Room.findOne({ _id: id, archivedAt: null, status: { $ne: 'inactive' } });
  if (!room) throw ApiError.notFound('Room not found');
  const beds = await Bed.find({ room: room._id }).sort({ label: 1 }).select('label status');
  return { ...room.toJSON(), beds: beds.map((b) => ({ label: b.label, status: publicBedStatus(b.status) })) };
}

export async function getStaffRoom(id) {
  const room = await Room.findById(id);
  if (!room) throw ApiError.notFound('Room not found');
  const beds = await Bed.find({ room: room._id }).sort({ label: 1 }).populate('occupant', 'name');
  return { ...room.toJSON(), beds: beds.map((b) => b.toJSON()) };
}

/** Per-hostel summary for the Boys/Girls portals and homepage numbers. Real data only. */
export async function getStats() {
  await expireStaleBookings();
  const rows = await Room.aggregate([
    { $match: { archivedAt: null, status: 'active' } },
    { $group: { _id: '$hostelType', rooms: { $sum: 1 }, totalBeds: { $sum: '$capacity' }, availableBeds: { $sum: '$availableBeds' }, minPrice: { $min: '$price' }, maxPrice: { $max: '$price' } } },
  ]);
  const empty = { rooms: 0, totalBeds: 0, availableBeds: 0, minPrice: null, maxPrice: null };
  const out = { boys: { ...empty }, girls: { ...empty } };
  for (const r of rows) out[r._id] = { rooms: r.rooms, totalBeds: r.totalBeds, availableBeds: r.availableBeds, minPrice: r.minPrice, maxPrice: r.maxPrice };
  return out;
}

async function createBeds(roomId, from, to) {
  const docs = [];
  for (let i = from; i < to; i += 1) docs.push({ room: roomId, label: bedLabel(i) });
  if (docs.length) await Bed.insertMany(docs);
}

export async function createRoom(data) {
  let room;
  try {
    room = await Room.create(data);
  } catch (err) {
    if (err?.code === 11000) throw ApiError.conflict(`Room ${data.roomNumber} already exists in the ${data.hostelType} hostel`);
    throw err;
  }
  try {
    await createBeds(room._id, 0, room.capacity);
  } catch (err) {
    await Room.deleteOne({ _id: room._id }); // never leave a room without beds
    throw err;
  }
  await syncRoomCounts(room._id);
  return Room.findById(room._id);
}

export async function updateRoom(id, data) {
  const room = await Room.findById(id);
  if (!room || room.archivedAt) throw ApiError.notFound('Room not found');

  if (data.hostelType && data.hostelType !== room.hostelType) {
    const busy = await Bed.countDocuments({ room: room._id, status: { $in: ['reserved', 'occupied'] } });
    if (busy) throw ApiError.conflict('Cannot change the hostel type while beds are reserved or occupied');
  }

  if (data.capacity && data.capacity !== room.capacity) {
    const beds = await Bed.find({ room: room._id }).sort({ label: 1 });
    if (data.capacity > beds.length) {
      await createBeds(room._id, beds.length, data.capacity);
    } else {
      const removable = beds.filter((b) => ['available', 'maintenance'].includes(b.status)).map((b) => b.label);
      const toRemove = beds.slice(data.capacity); // the highest labels
      if (toRemove.some((b) => !removable.includes(b.label))) {
        throw ApiError.conflict('Cannot reduce capacity: the highest-numbered beds are reserved or occupied');
      }
      await Bed.deleteMany({ _id: { $in: toRemove.map((b) => b._id) } });
    }
  }

  room.set(data);
  try {
    await room.save();
  } catch (err) {
    if (err?.code === 11000) throw ApiError.conflict('Another room already uses this number in that hostel');
    throw err;
  }
  await syncRoomCounts(room._id);
  return Room.findById(room._id);
}

/** "Delete" = archive. Refused while any bed is reserved/occupied; history is always kept. */
export async function archiveRoom(id) {
  const room = await Room.findById(id);
  if (!room || room.archivedAt) throw ApiError.notFound('Room not found');
  const busy = await Bed.countDocuments({ room: room._id, status: { $in: ['reserved', 'occupied'] } });
  if (busy) throw ApiError.conflict('This room has reserved or occupied beds. Resolve those bookings first.');
  room.archivedAt = new Date();
  room.status = 'inactive';
  await room.save();
  await syncRoomCounts(room._id);
  return room;
}

/** Toggle a bed between available and maintenance. Reserved/occupied beds cannot be touched. */
export async function setBedMaintenance(roomId, bedId, maintenance) {
  const from = maintenance ? 'available' : 'maintenance';
  const to = maintenance ? 'maintenance' : 'available';
  const bed = await Bed.findOneAndUpdate({ _id: bedId, room: roomId, status: from }, { $set: { status: to } }, { new: true });
  if (!bed) throw ApiError.conflict(maintenance ? 'Only an available bed can be put under maintenance' : 'Bed is not under maintenance');
  await syncRoomCounts(roomId);
  return bed;
}

export async function listBookableBeds(roomId) {
  return Bed.find({ room: roomId, status: 'available' }).sort({ label: 1 });
}

// ── favorites ──
export async function listFavorites(userId) {
  const favs = await Favorite.find({ user: userId }).sort({ createdAt: -1 }).populate({ path: 'room', match: { archivedAt: null, status: { $ne: 'inactive' } } });
  return favs.map((f) => f.room).filter(Boolean);
}

export async function addFavorite(userId, roomId) {
  const room = await Room.exists({ _id: roomId, archivedAt: null, status: { $ne: 'inactive' } });
  if (!room) throw ApiError.notFound('Room not found');
  await Favorite.updateOne({ user: userId, room: roomId }, { $setOnInsert: { user: userId, room: roomId } }, { upsert: true });
}

export const removeFavorite = (userId, roomId) => Favorite.deleteOne({ user: userId, room: roomId });
export const favoriteIds = async (userId) => (await Favorite.find({ user: userId }).select('room')).map((f) => String(f.room));

export async function countActiveBookingsForRoom(roomId) {
  return Booking.countDocuments({ room: roomId, isActiveHold: true });
}
