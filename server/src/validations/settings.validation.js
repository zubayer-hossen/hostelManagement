import { z } from 'zod';
import { BIODATA_FIELDS } from '../constants/resident.js';

const text = (max) => z.string().trim().max(max);
const httpUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), 'Must be an http(s) URL');
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex color like #4f46e5');

/** Every field optional: the endpoint performs partial updates. Unknown keys are dropped. */
export const updateSettingsBody = z
  .object({
    general: z
      .object({
        hostelName: text(120).min(2, 'Hostel name is required'),
        tagline: text(200),
        description: text(1000),
        logoUrl: httpUrl,
        faviconUrl: httpUrl,
        address: text(400),
      })
      .partial(),
    contact: z
      .object({
        phone: text(30),
        email: z.union([z.literal(''), z.string().trim().toLowerCase().email().max(254)]),
        emergencyPhone: text(30),
        officeHours: text(200),
        supportInfo: text(500),
      })
      .partial(),
    social: z
      .object({
        facebook: httpUrl,
        instagram: httpUrl,
        youtube: httpUrl,
        whatsapp: httpUrl,
        messenger: httpUrl,
        tiktok: httpUrl,
        linkedin: httpUrl,
      })
      .partial(),
    location: z
      .object({
        latitude: z.number().min(-90).max(90).nullable(),
        longitude: z.number().min(-180).max(180).nullable(),
        mapEmbedUrl: httpUrl,
        nearbyLandmarks: text(500),
        transportInfo: text(500),
      })
      .partial(),
    emergency: z
      .object({ police: text(30), ambulance: text(30), fire: text(30), hospital: text(120), hostelContact: text(60) })
      .partial(),
    visitorStats: z.object({ showOnlineNow: z.boolean(), showToday: z.boolean(), showTotal: z.boolean() }).partial(),
    meetings: z
      .object({
        enabled: z.boolean(),
        days: z.array(z.number().int().min(0).max(6)).max(7),
        startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM'),
        endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM'),
        slotMinutes: z.number().int().min(10).max(240),
        maxPerSlot: z.number().int().min(1).max(10),
        maxAdvanceDays: z.number().int().min(1).max(180),
        utcOffsetMinutes: z.number().int().min(-720).max(840),
        blackoutDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')).max(400),
      })
      .partial()
      .refine((d) => !d.startTime || !d.endTime || d.startTime < d.endTime, { message: 'End time must be after start time', path: ['endTime'] }),
    residentForm: z.object({ requiredFields: z.array(z.enum(BIODATA_FIELDS)).max(BIODATA_FIELDS.length) }).partial(),
    footer: z.object({ showQuickLinks: z.boolean(), copyrightText: text(200) }).partial(),
    navigation: z
      .array(
        z.object({
          key: text(30).min(1),
          label: text(40).min(1),
          labelBn: text(40).optional().default(''),
          path: z.string().trim().regex(/^\/[A-Za-z0-9\-_/]*$/, 'Must be an internal path like /about').max(200),
          enabled: z.boolean(),
        })
      )
      .max(20),
    homeSections: z
      .array(
        z.object({
          key: z.enum(['hero', 'headlines', 'facilities', 'notices', 'faq', 'contact']),
          enabled: z.boolean(),
        })
      )
      .max(10),
    theme: z
      .object({
        mode: z.enum(['light', 'dark', 'system']),
        primaryColor: hex,
        secondaryColor: hex,
        accentColor: hex,
        borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'xl']),
        animations: z.boolean(),
      })
      .partial(),
    seo: z
      .object({
        siteTitle: text(120),
        metaDescription: text(300),
        keywords: text(300),
        ogImageUrl: httpUrl,
      })
      .partial(),
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'Nothing to update' });
