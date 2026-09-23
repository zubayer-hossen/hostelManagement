import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPagination } from '../utils/response.js';
import { User } from '../models/User.js';
import { config } from '../config/env.js';
import { STAFF_ROLES } from '../constants/roles.js';
import { resolvePermissions } from './permissionService.js';
import { getHostelName } from './settingsService.js';
import { sendEventEmail } from './emailService.js';

/** Creates an in-app notification. Never throws: a failed notification must not break the action that caused it. */
export async function notify(userId, { type, title, body = '', link = '' }, { email = false } = {}) {
  if (!userId) return null;
  let created = null;
  try {
    created = await Notification.create({ user: userId, type, title, body, link });
  } catch (err) {
    console.error('[notify] failed:', err.message);
  }
  if (email) {
    try {
      const user = await User.findById(userId).select('name email isActive');
      if (user?.isActive) {
        await sendEventEmail(user.email, { name: user.name, subject: title, lines: body ? [body] : [], link: link ? `${config.CLIENT_URL.replace(/\/$/, '')}${link}` : undefined }, await getHostelName());
      }
    } catch (err) {
      console.error('[notify] e-mail failed:', err.message);
    }
  }
  return created;
}

/** In-app notification for every active staff member who holds `permission` (e.g. a new support ticket). */
export async function notifyStaff(permission, payload) {
  try {
    const staff = await User.find({ role: { $in: STAFF_ROLES }, isActive: true, deletedAt: null }).limit(100);
    for (const u of staff) {
      if ((await resolvePermissions(u)).includes(permission)) await notify(u._id, payload);
    }
  } catch (err) {
    console.error('[notifyStaff] failed:', err.message);
  }
}

export async function listNotifications(userId, { page = 1, limit = 20, unread = false }) {
  const filter = { user: userId, ...(unread ? { readAt: null } : {}) };
  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, readAt: null }),
  ]);
  return { items, meta: { ...buildPagination({ page, limit, total }), unreadCount } };
}

export async function markRead(userId, id) {
  const n = await Notification.findOneAndUpdate({ _id: id, user: userId }, { $set: { readAt: new Date() } }, { new: true });
  if (!n) throw ApiError.notFound('Notification not found');
  return n;
}

export const markAllRead = (userId) => Notification.updateMany({ user: userId, readAt: null }, { $set: { readAt: new Date() } });
