import { ROLES } from './roles.js';

export const PERMISSIONS = Object.freeze({
  MANAGE_USERS: 'manageUsers',
  MANAGE_RESIDENTS: 'manageResidents',
  MANAGE_ROOMS: 'manageRooms',
  MANAGE_BOOKINGS: 'manageBookings',
  MANAGE_PAYMENTS: 'managePayments',
  MANAGE_COMPLAINTS: 'manageComplaints',
  MANAGE_NOTICES: 'manageNotices',
  MANAGE_BLOGS: 'manageBlogs',
  MANAGE_GALLERY: 'manageGallery',
  MANAGE_FAQ: 'manageFAQ',
  MANAGE_FOOD_MENU: 'manageFoodMenu',
  MANAGE_BANNERS: 'manageBanners',
  MANAGE_SETTINGS: 'manageSettings',
  MANAGE_MEETINGS: 'manageMeetings',
  VIEW_ANALYTICS: 'viewAnalytics',
  MANAGE_ROLES: 'manageRoles',
  // Additions (documented in PROJECT_ARCHITECTURE.md)
  MANAGE_FACILITIES: 'manageFacilities',
  MANAGE_EVENTS: 'manageEvents',
  MANAGE_SUPPORT: 'manageSupport',
  MANAGE_RULES: 'manageRules',
  MANAGE_MEDIA: 'manageMedia',
  MANAGE_REVIEWS: 'manageReviews',
  MANAGE_RESIDENT_DOCUMENTS: 'manageResidentDocuments',
  VIEW_AUDIT_LOGS: 'viewAuditLogs',
});

export const PERMISSION_LIST = Object.values(PERMISSIONS);

const P = PERMISSIONS;

/** Defaults used to seed the Role collection. After seeding, the database is the source of truth. */
export const DEFAULT_ROLE_PERMISSIONS = Object.freeze({
  [ROLES.SUPER_ADMIN]: [...PERMISSION_LIST],
  [ROLES.OWNER]: PERMISSION_LIST.filter((p) => p !== P.MANAGE_ROLES),
  [ROLES.MANAGER]: [
    P.MANAGE_RESIDENTS, P.MANAGE_ROOMS, P.MANAGE_BOOKINGS, P.MANAGE_PAYMENTS,
    P.MANAGE_COMPLAINTS, P.MANAGE_NOTICES, P.MANAGE_MEETINGS, P.MANAGE_SUPPORT,
    P.MANAGE_FOOD_MENU, P.MANAGE_FACILITIES, P.MANAGE_EVENTS, P.MANAGE_REVIEWS,
    P.MANAGE_RESIDENT_DOCUMENTS, P.VIEW_ANALYTICS,
  ],
  [ROLES.ADMIN]: [
    P.MANAGE_NOTICES, P.MANAGE_BLOGS, P.MANAGE_GALLERY, P.MANAGE_FAQ, P.MANAGE_FOOD_MENU,
    P.MANAGE_BANNERS, P.MANAGE_FACILITIES, P.MANAGE_EVENTS, P.MANAGE_RULES, P.MANAGE_MEDIA,
    P.MANAGE_REVIEWS, P.MANAGE_SUPPORT,
  ],
  [ROLES.HOSTEL_RESIDENT]: [],
  [ROLES.GENERAL_USER]: [],
});

export const isValidPermission = (p) => PERMISSION_LIST.includes(p);
