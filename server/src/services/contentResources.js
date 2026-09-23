import { Banner } from '../models/Banner.js';
import { Headline } from '../models/Headline.js';
import { Facility } from '../models/Facility.js';
import { FoodMenu, DAYS } from '../models/FoodMenu.js';
import { Notice } from '../models/Notice.js';
import { Faq } from '../models/Faq.js';
import { GalleryItem } from '../models/GalleryItem.js';
import { Event } from '../models/Event.js';
import { activeWindow } from '../utils/schemaOptions.js';
import { PERMISSIONS as P } from '../constants/permissions.js';
import * as v from '../validations/content.validation.js';

const forHostel = (type) => (type ? { hostelType: { $in: ['all', type] } } : {});

/**
 * Declarative description of every simple CMS resource.
 * Adding a resource = one entry here + a model + a Zod schema.
 */
export const RESOURCES = [
  {
    path: 'banners', entity: 'Banner', Model: Banner, permission: P.MANAGE_BANNERS,
    body: v.bannerBody, publicQuery: v.publicQueries.banners,
    searchFields: ['title', 'subtitle'], adminSort: { order: 1, createdAt: -1 },
    publicFilter: (_q, now) => activeWindow('startsAt', 'endsAt', now), publicSort: { order: 1, createdAt: -1 },
  },
  {
    path: 'headlines', entity: 'Headline', Model: Headline, permission: P.MANAGE_BANNERS,
    body: v.headlineBody, publicQuery: v.publicQueries.headlines,
    searchFields: ['text'], adminSort: { priority: -1, createdAt: -1 },
    publicFilter: (_q, now) => activeWindow('startsAt', 'endsAt', now), publicSort: { priority: -1, createdAt: -1 },
  },
  {
    path: 'facilities', entity: 'Facility', Model: Facility, permission: P.MANAGE_FACILITIES,
    body: v.facilityBody, publicQuery: v.publicQueries.facilities,
    searchFields: ['name', 'description'], adminSort: { order: 1, name: 1 },
    publicFilter: (q) => ({ isActive: true, ...forHostel(q.hostelType) }), publicSort: { order: 1, name: 1 },
  },
  {
    path: 'food-menu', entity: 'FoodMenu', Model: FoodMenu, permission: P.MANAGE_FOOD_MENU,
    body: v.foodMenuBody, publicQuery: v.publicQueries.foodMenu,
    searchFields: ['description', 'items'], adminSort: { hostelType: 1, day: 1, meal: 1 },
    publicFilter: (q) => ({ isActive: true, ...forHostel(q.hostelType) }), publicSort: { hostelType: 1 },
    // Sorting by weekday/meal is done by the client (Saturday-first week).
    dayOrder: DAYS,
  },
  {
    path: 'notices', entity: 'Notice', Model: Notice, permission: P.MANAGE_NOTICES,
    body: v.noticeBody, publicQuery: v.publicQueries.notices,
    searchFields: ['title', 'body'], adminSort: { isPinned: -1, publishAt: -1 },
    // Public site shows only audiences a visitor can be part of; resident/staff notices are for dashboards.
    publicFilter: (q, now) => ({
      isActive: true,
      audience: q.audience ? { $in: ['everyone', q.audience] } : { $in: ['everyone', 'boys', 'girls'] },
      publishAt: { $lte: now },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }),
    publicSort: { isPinned: -1, publishAt: -1 },
  },
  {
    path: 'faqs', entity: 'Faq', Model: Faq, permission: P.MANAGE_FAQ,
    body: v.faqBody, publicQuery: v.publicQueries.faqs,
    searchFields: ['question', 'answer', 'category'], adminSort: { category: 1, order: 1 },
    publicFilter: (q) => ({
      isActive: true,
      ...(q.category ? { category: q.category } : {}),
      ...(q.featured === 'true' ? { isFeatured: true } : {}),
    }),
    publicSort: { category: 1, order: 1 },
  },
  {
    path: 'gallery', entity: 'GalleryItem', Model: GalleryItem, permission: P.MANAGE_GALLERY,
    body: v.galleryBody, publicQuery: v.publicQueries.gallery,
    searchFields: ['title', 'description'], adminSort: { order: 1, createdAt: -1 },
    publicFilter: (q) => ({
      isActive: true,
      ...(q.category ? { category: q.category } : {}),
      ...(q.featured === 'true' ? { isFeatured: true } : {}),
    }),
    publicSort: { order: 1, createdAt: -1 },
  },
  {
    path: 'events', entity: 'Event', Model: Event, permission: P.MANAGE_EVENTS,
    body: v.eventBody, publicQuery: v.publicQueries.events,
    searchFields: ['title', 'location', 'organizer'], adminSort: { startsAt: -1 },
    // "upcoming" = not finished yet (ends, or if no end time, starts, in the future)
    publicFilter: (q, now) => {
      const base = { isActive: true };
      if (q.when === 'all') return base;
      const future = { $or: [{ endsAt: { $gte: now } }, { endsAt: null, startsAt: { $gte: now } }] };
      return q.when === 'past' ? { ...base, $nor: future.$or } : { ...base, ...future };
    },
    publicSort: { startsAt: 1 },
  },
];
