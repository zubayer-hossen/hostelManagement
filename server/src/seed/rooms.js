import { Room } from '../models/Room.js';
import { Bed } from '../models/Bed.js';
import { Booking } from '../models/Booking.js';
import { OccupancyRecord } from '../models/OccupancyRecord.js';
import { Favorite } from '../models/Favorite.js';
import { bedLabel } from '../utils/roomUtils.js';
import { syncRoomCounts } from '../services/bedService.js';

export const ROOM_MODELS = [Room, Bed, Booking, OccupancyRecord, Favorite];

const CAPACITY = { single: 1, double: 2, triple: 3, quad: 4, dormitory: 8 };

// [roomNumber, floor, roomType, price per bed (BDT/month), ac, attachedBathroom, balcony, sizeSqFt]
const BOYS = [
  ['101', 1, 'quad', 3500, false, false, false, 200], ['102', 1, 'triple', 4200, false, false, true, 180],
  ['103', 1, 'double', 5000, false, true, false, 150], ['201', 2, 'quad', 3600, false, false, true, 200],
  ['202', 2, 'double', 6500, true, true, true, 160], ['203', 2, 'single', 9000, true, true, true, 110],
  ['301', 3, 'dormitory', 2800, false, false, false, 420],
];
const GIRLS = [
  ['101', 1, 'quad', 3700, false, false, false, 200], ['102', 1, 'triple', 4400, false, false, true, 180],
  ['201', 2, 'double', 5200, false, true, false, 150], ['202', 2, 'double', 6800, true, true, true, 160],
  ['203', 2, 'single', 9200, true, true, true, 110], ['301', 3, 'quad', 3900, false, false, true, 210],
];

const build = (hostelType, rows) => rows.map(([roomNumber, floor, roomType, price, hasAC, attached, hasBalcony, sizeSqFt]) => ({
  roomNumber, hostelType, floor, roomType, price, hasAC, hasBalcony, sizeSqFt,
  capacity: CAPACITY[roomType],
  bathroomType: attached ? 'attached' : 'shared',
  bedType: roomType === 'dormitory' ? 'bunk' : 'single',
  description: `Sample ${roomType} room on floor ${floor} — edit or replace from the admin panel.`,
  facilities: [hasAC ? 'Air conditioning' : 'Ceiling fan', 'Study table', 'Wardrobe'],
}));

/** Sample rooms + beds. Every bed starts available, so sample data can be freely archived later. */
export async function seedRooms() {
  if (await Room.estimatedDocumentCount()) return console.info('  • rooms: already have data (kept)');

  const rooms = await Room.insertMany([...build('boys', BOYS), ...build('girls', GIRLS)]);
  const beds = rooms.flatMap((r) => Array.from({ length: r.capacity }, (_, i) => ({ room: r._id, label: bedLabel(i) })));
  await Bed.insertMany(beds);

  // One room under maintenance and one bed under maintenance, so the badges can be seen.
  const maintenanceRoom = rooms.find((r) => r.hostelType === 'boys' && r.roomNumber === '301');
  await Room.updateOne({ _id: maintenanceRoom._id }, { $set: { status: 'maintenance' } });
  const oneBed = rooms.find((r) => r.hostelType === 'girls' && r.roomNumber === '102');
  await Bed.updateOne({ room: oneBed._id, label: 'C' }, { $set: { status: 'maintenance' } });

  for (const r of rooms) await syncRoomCounts(r._id);
  console.info(`  • rooms: ${rooms.length} sample rooms and ${beds.length} beds created`);
}
