import { ICONS, DAYS, MEALS, GALLERY_CATEGORIES } from './site.js';

/**
 * Declarative description of every CMS resource screen. Adding a screen = one entry here
 * (the server side is the matching entry in server/src/services/contentResources.js).
 * field types: text | textarea | number | boolean | select | datetime | date | list
 */
const f = (name, type = 'text', extra = {}) => ({ name, type, ...extra });
const opts = (values, i18nPrefix) => values.map((v) => ({ value: v, labelKey: i18nPrefix ? `${i18nPrefix}.${v}` : null, label: v }));

const HOSTEL = opts(['all', 'boys', 'girls'], 'public.hostelType');

export const CMS_RESOURCES = {
  banners: {
    path: 'banners', titleKey: 'cms.resources.banners', permission: 'manageBanners',
    columns: [{ key: 'title' }, { key: 'order' }, { key: 'isActive', type: 'active' }, { key: 'startsAt', type: 'date' }, { key: 'endsAt', type: 'date' }],
    fields: [f('title', 'text', { required: true, max: 140 }), f('subtitle', 'text', { max: 200 }), f('description', 'textarea', { max: 600 }), f('imageUrl', 'image', { purpose: 'banner' }), f('videoUrl', 'text'),
      f('ctaText', 'text', { max: 40 }), f('ctaLink', 'text', { hintKey: 'cms.hints.link' }), f('secondaryCtaText', 'text', { max: 40 }), f('secondaryCtaLink', 'text'),
      f('order', 'number', { default: 0 }), f('isActive', 'boolean', { default: true }), f('startsAt', 'datetime', { nullable: true }), f('endsAt', 'datetime', { nullable: true })],
  },
  headlines: {
    path: 'headlines', titleKey: 'cms.resources.headlines', permission: 'manageBanners',
    columns: [{ key: 'text' }, { key: 'priority' }, { key: 'isActive', type: 'active' }, { key: 'endsAt', type: 'date' }],
    fields: [f('text', 'text', { required: true, max: 200 }), f('link', 'text', { hintKey: 'cms.hints.link' }), f('priority', 'number', { default: 0, hintKey: 'cms.hints.priority' }), f('isActive', 'boolean', { default: true }), f('startsAt', 'datetime', { nullable: true }), f('endsAt', 'datetime', { nullable: true })],
  },
  facilities: {
    path: 'facilities', titleKey: 'cms.resources.facilities', permission: 'manageFacilities',
    columns: [{ key: 'name' }, { key: 'hostelType', type: 'hostel' }, { key: 'order' }, { key: 'isActive', type: 'active' }],
    fields: [f('name', 'text', { required: true, max: 80 }), f('description', 'textarea', { max: 400 }), f('icon', 'select', { options: Object.keys(ICONS).map((k) => ({ value: k, label: k })), default: 'sparkles' }), f('imageUrl', 'image', { purpose: 'facility' }),
      f('hostelType', 'select', { options: HOSTEL, default: 'all' }), f('order', 'number', { default: 0 }), f('isActive', 'boolean', { default: true })],
  },
  'food-menu': {
    path: 'food-menu', titleKey: 'cms.resources.foodMenu', permission: 'manageFoodMenu',
    columns: [{ key: 'hostelType', type: 'hostel' }, { key: 'day', type: 'i18n', prefix: 'public.food.dayNames' }, { key: 'meal', type: 'i18n', prefix: 'public.food.meals' }, { key: 'items', type: 'list' }, { key: 'isActive', type: 'active' }],
    fields: [f('hostelType', 'select', { options: HOSTEL, default: 'all', required: true }), f('day', 'select', { options: opts(DAYS, 'public.food.dayNames'), default: 'saturday', required: true }), f('meal', 'select', { options: opts(MEALS, 'public.food.meals'), default: 'breakfast', required: true }),
      f('items', 'list', { hintKey: 'cms.hints.list' }), f('description', 'text', { max: 300 }), f('imageUrl', 'image', { purpose: 'food' }), f('isSpecial', 'boolean', { default: false }), f('price', 'number', { nullable: true }), f('isActive', 'boolean', { default: true })],
  },
  notices: {
    path: 'notices', titleKey: 'cms.resources.notices', permission: 'manageNotices',
    columns: [{ key: 'title' }, { key: 'audience', type: 'text' }, { key: 'priority', type: 'text' }, { key: 'isPinned', type: 'bool' }, { key: 'publishAt', type: 'date' }, { key: 'isActive', type: 'active' }],
    fields: [f('title', 'text', { required: true, max: 160 }), f('body', 'textarea', { max: 5000 }), f('imageUrl', 'image', { purpose: 'notice' }), f('attachmentUrl'),
      f('priority', 'select', { options: opts(['normal', 'important', 'urgent'], 'public.notices'), default: 'normal' }),
      f('audience', 'select', { options: opts(['everyone', 'boys', 'girls', 'residents', 'staff', 'admins'], 'cms.audience'), default: 'everyone' }),
      f('isPinned', 'boolean', { default: false }), f('publishAt', 'datetime', { default: 'now' }), f('expiresAt', 'datetime', { nullable: true }), f('isActive', 'boolean', { default: true })],
  },
  events: {
    path: 'events', titleKey: 'cms.resources.events', permission: 'manageEvents',
    columns: [{ key: 'title' }, { key: 'startsAt', type: 'date' }, { key: 'location' }, { key: 'status', type: 'i18n', prefix: 'cms.eventStatus' }, { key: 'isActive', type: 'active' }],
    fields: [f('title', 'text', { required: true, max: 160 }), f('description', 'textarea', { max: 3000 }), f('imageUrl', 'image', { purpose: 'event' }),
      f('startsAt', 'datetime', { required: true, default: 'now' }), f('endsAt', 'datetime', { nullable: true }), f('location', 'text', { max: 200 }), f('organizer', 'text', { max: 120 }),
      f('registrationLink', 'text', { hintKey: 'cms.hints.link' }),
      f('status', 'select', { options: opts(['scheduled', 'cancelled', 'completed'], 'cms.eventStatus'), default: 'scheduled' }), f('isActive', 'boolean', { default: true })],
  },
  faqs: {
    path: 'faqs', titleKey: 'cms.resources.faqs', permission: 'manageFAQ',
    columns: [{ key: 'question' }, { key: 'category' }, { key: 'order' }, { key: 'isFeatured', type: 'bool' }, { key: 'isActive', type: 'active' }],
    fields: [f('question', 'text', { required: true, max: 300 }), f('answer', 'textarea', { required: true, max: 3000 }), f('category', 'text', { default: 'General', max: 60 }), f('order', 'number', { default: 0 }), f('isFeatured', 'boolean', { default: false }), f('isActive', 'boolean', { default: true })],
  },
  gallery: {
    path: 'gallery', titleKey: 'cms.resources.gallery', permission: 'manageGallery',
    columns: [{ key: 'imageUrl', type: 'thumb' }, { key: 'title' }, { key: 'category', type: 'i18n', prefix: 'public.gallery.categories' }, { key: 'isFeatured', type: 'bool' }, { key: 'isActive', type: 'active' }],
    fields: [f('imageUrl', 'image', { required: true, purpose: 'gallery' }), f('title', 'text', { max: 120 }), f('description', 'textarea', { max: 400 }),
      f('category', 'select', { options: opts(GALLERY_CATEGORIES, 'public.gallery.categories'), default: 'hostel' }), f('date', 'date', { nullable: true }), f('isFeatured', 'boolean', { default: false }), f('order', 'number', { default: 0 }), f('isActive', 'boolean', { default: true })],
  },
};

export const CMS_LIST = Object.values(CMS_RESOURCES);
