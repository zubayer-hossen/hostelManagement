import { z } from 'zod';

import { ROOM_TYPES, AVAILABILITY } from '../models/Room.js';

import { objectId, booleanQuery } from './common.js';

/**
 * Reusable URL / internal path validation.
 *
 * Accepts:
 * - https://example.com/image.jpg
 * - http://example.com/image.jpg
 * - /uploads/image.jpg
 *
 * Empty string is also allowed because some fields are optional.
 */
const link = z
  .string()
  .trim()
  .max(1000)
  .refine(
    (value) =>
      value === '' ||
      /^(https?:\/\/|\/)\S*$/i.test(value),
    'Must be an http(s) URL or an internal path'
  );

/**
 * Image URL validation.
 *
 * Each image must be a non-empty valid link.
 * Maximum 10 images per room.
 */
const imageLink = link.refine(
  (value) => value.length > 0,
  'Image URL cannot be empty'
);

const roomFields = z.object({
  roomNumber: z
    .string()
    .trim()
    .min(1)
    .max(20),

  hostelType: z.enum(['boys', 'girls']),

  floor: z
    .number()
    .int()
    .min(0)
    .max(50),

  roomType: z.enum(ROOM_TYPES),

  description: z
    .string()
    .trim()
    .max(2000),

  imageUrls: z
    .array(imageLink)
    .max(10),

  videoUrl: link,

  capacity: z
    .number()
    .int()
    .min(1)
    .max(12),

  price: z
    .number()
    .min(0)
    .max(10000000),

  sizeSqFt: z
    .number()
    .min(0)
    .max(100000)
    .nullable(),

  bathroomType: z.enum(['attached', 'shared']),

  hasAC: z.boolean(),

  hasWifi: z.boolean(),

  hasBalcony: z.boolean(),

  hasStudyTable: z.boolean(),

  hasWardrobe: z.boolean(),

  bedType: z.enum(['single', 'bunk']),

  facilities: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(40)
    )
    .max(20),

  status: z.enum([
    'active',
    'maintenance',
    'inactive',
  ]),
});

/**
 * Create room
 *
 * Required:
 * - roomNumber
 * - hostelType
 * - floor
 * - roomType
 * - capacity
 * - price
 *
 * Other fields are optional.
 */
export const createRoomBody = roomFields
  .pick({
    roomNumber: true,
    hostelType: true,
    floor: true,
    roomType: true,
    capacity: true,
    price: true,
  })
  .merge(
    roomFields
      .omit({
        roomNumber: true,
        hostelType: true,
        floor: true,
        roomType: true,
        capacity: true,
        price: true,
      })
      .partial()
  );

/**
 * Update room
 *
 * At least one field must be supplied.
 */
export const updateRoomBody = roomFields
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: 'Nothing to update',
    }
  );

/**
 * Number coercion for query parameters.
 */
const num = z.coerce.number();

/**
 * Public + staff room list filters.
 *
 * Query parameters arrive as strings.
 * Booleans arrive as "true"/"false".
 */
export const listRoomsQuery = z.object({
  page: z
    .coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z
    .coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(12),

  q: z
    .string()
    .trim()
    .max(60)
    .optional(),

  hostelType: z
    .enum(['boys', 'girls'])
    .optional(),

  roomType: z
    .enum(ROOM_TYPES)
    .optional(),

  floor: z
    .coerce
    .number()
    .int()
    .min(0)
    .max(50)
    .optional(),

  capacity: z
    .coerce
    .number()
    .int()
    .min(1)
    .max(12)
    .optional(),

  minPrice: num
    .min(0)
    .optional(),

  maxPrice: num
    .min(0)
    .optional(),

  ac: booleanQuery.optional(),

  attachedBathroom: booleanQuery.optional(),

  wifi: booleanQuery.optional(),

  availability: z
    .enum(['available', ...AVAILABILITY])
    .optional(),

  sort: z
    .enum([
      'price',
      '-price',
      'floor',
      '-floor',
      'capacity',
      '-capacity',
      'newest',
      'roomNumber',
    ])
    .default('roomNumber'),
});

/**
 * Admin room filters.
 */
export const adminRoomsQuery = listRoomsQuery.extend({
  status: z
    .enum(['active', 'maintenance', 'inactive'])
    .optional(),

  includeArchived: booleanQuery.optional(),
});

/**
 * Room ID params.
 */
export const roomIdParams = z.object({
  id: objectId,
});

/**
 * Room + bed ID params.
 */
export const bedParams = z.object({
  id: objectId,
  bedId: objectId,
});

/**
 * Bed maintenance update.
 */
export const bedMaintenanceBody = z.object({
  maintenance: z.boolean(),
});

/**
 * Room favorite params.
 */
export const roomFavoriteParams = z.object({
  roomId: objectId,
});