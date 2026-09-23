import { z } from 'zod';
import { DAYS, MEALS } from '../models/FoodMenu.js';
import { NOTICE_AUDIENCES } from '../models/Notice.js';
import { GALLERY_CATEGORIES } from '../models/GalleryItem.js';
import { PAGE_KEYS } from '../models/PageContent.js';
import { emailSchema, nameSchema, phoneSchema } from './common.js';

const text = (max) => z.string().trim().max(max);
const dateOrNull = z.coerce.date().nullable().optional();
/** Absolute http(s) URL, an internal path ("/rooms"), or empty. */
const link = z.string().trim().max(1000).refine((v) => v === '' || /^(https?:\/\/|\/)\S*$/i.test(v), 'Must be an http(s) URL or an internal path');
const hostelType = z.enum(['all', 'boys', 'girls']);
const order = z.coerce.number().int().min(-1000).max(100000);
const windowOk = (d) => !d.startsAt || !d.endsAt || d.endsAt > d.startsAt;
const windowMsg = { message: 'End date must be after start date', path: ['endsAt'] };

export const bannerBody = z
  .object({
    title: text(140).min(2),
    subtitle: text(200).optional(),
    description: text(600).optional(),
    imageUrl: link.optional(),
    videoUrl: link.optional(),
    ctaText: text(40).optional(),
    ctaLink: link.optional(),
    secondaryCtaText: text(40).optional(),
    secondaryCtaLink: link.optional(),
    order: order.optional(),
    isActive: z.boolean().optional(),
    startsAt: dateOrNull,
    endsAt: dateOrNull,
  })
  .refine(windowOk, windowMsg);

export const headlineBody = z
  .object({
    text: text(200).min(2),
    link: link.optional(),
    priority: order.optional(),
    isActive: z.boolean().optional(),
    startsAt: dateOrNull,
    endsAt: dateOrNull,
  })
  .refine(windowOk, windowMsg);

export const facilityBody = z.object({
  name: text(80).min(2),
  description: text(400).optional(),
  icon: text(30).optional(),
  imageUrl: link.optional(),
  hostelType: hostelType.optional(),
  order: order.optional(),
  isActive: z.boolean().optional(),
});

export const foodMenuBody = z.object({
  hostelType: hostelType,
  day: z.enum(DAYS),
  meal: z.enum(MEALS),
  items: z.array(text(80).min(1)).max(15).optional(),
  description: text(300).optional(),
  imageUrl: link.optional(),
  isSpecial: z.boolean().optional(),
  price: z.number().min(0).max(100000).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const noticeBody = z
  .object({
    title: text(160).min(2),
    body: text(5000).optional(),
    imageUrl: link.optional(),
    attachmentUrl: link.optional(),
    priority: z.enum(['normal', 'important', 'urgent']).optional(),
    audience: z.enum(NOTICE_AUDIENCES).optional(),
    isPinned: z.boolean().optional(),
    publishAt: z.coerce.date().optional(),
    expiresAt: dateOrNull,
    isActive: z.boolean().optional(),
  })
  .refine((d) => !d.publishAt || !d.expiresAt || d.expiresAt > d.publishAt, { message: 'Expiry must be after the publish date', path: ['expiresAt'] });

export const faqBody = z.object({
  question: text(300).min(3),
  answer: text(3000).min(1),
  category: text(60).optional(),
  order: order.optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const galleryBody = z.object({
  title: text(120).optional(),
  description: text(400).optional(),
  imageUrl: link.refine((v) => v !== '', 'Image URL is required'),
  category: z.enum(GALLERY_CATEGORIES).optional(),
  date: dateOrNull,
  isFeatured: z.boolean().optional(),
  order: order.optional(),
  isActive: z.boolean().optional(),
});

export const eventBody = z
  .object({
    title: text(160).min(2),
    description: text(3000).optional(),
    imageUrl: link.optional(),
    startsAt: z.coerce.date(),
    endsAt: dateOrNull,
    location: text(200).optional(),
    organizer: text(120).optional(),
    registrationLink: link.optional(),
    status: z.enum(['scheduled', 'cancelled', 'completed']).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => !d.endsAt || d.endsAt >= d.startsAt, { message: 'End must be after the start', path: ['endsAt'] });

export const pageParams = z.object({ key: z.enum(PAGE_KEYS) });
export const pageBody = z.object({ title: text(160).min(2), content: text(50000) });

export const contactBody = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  subject: text(140).optional(),
  message: text(3000).min(10, 'Message must be at least 10 characters'),
  /** Honeypot: real users never see or fill this field. */
  website: z.string().max(200).optional(),
});

// ── Public list queries ──
const limit = z.coerce.number().int().min(1).max(200).default(100);
export const publicQueries = {
  banners: z.object({ limit }),
  headlines: z.object({ limit }),
  facilities: z.object({ limit, hostelType: hostelType.optional() }),
  foodMenu: z.object({ limit, hostelType: hostelType.optional() }),
  notices: z.object({ limit: z.coerce.number().int().min(1).max(100).default(30), audience: z.enum(['everyone', 'boys', 'girls']).optional() }),
  faqs: z.object({ limit, category: text(60).optional(), featured: z.enum(['true', 'false']).optional() }),
  events: z.object({ limit, when: z.enum(['upcoming', 'past', 'all']).default('upcoming') }),
  gallery: z.object({ limit, category: z.enum(GALLERY_CATEGORIES).optional(), featured: z.enum(['true', 'false']).optional() }),
};

export const adminListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: text(80).optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

export const contactListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['new', 'read', 'resolved']).optional(),
});
export const contactStatusBody = z.object({ status: z.enum(['new', 'read', 'resolved']) });

/** PATCH schema = the create schema with every field optional (at least one required). */
export function toPatch(schema) {
  const obj = typeof schema.innerType === 'function' ? schema.innerType() : schema;
  return obj.partial().refine((d) => Object.keys(d).length > 0, { message: 'Nothing to update' });
}
