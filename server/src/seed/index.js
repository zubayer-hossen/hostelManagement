import { config } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { Role } from '../models/Role.js';
import { User } from '../models/User.js';
import { SiteSetting } from '../models/SiteSetting.js';
import { Session } from '../models/Session.js';
import { LoginHistory } from '../models/LoginHistory.js';
import { AuditLog } from '../models/AuditLog.js';
import { ROLES, ROLE_LIST, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_LEVELS } from '../constants/roles.js';
import { DEFAULT_ROLE_PERMISSIONS } from '../constants/permissions.js';
import { passwordSchema, emailSchema } from '../validations/common.js';
import { hashPassword } from '../services/authService.js';
import { seedContent, CONTENT_MODELS } from './content.js';
import { seedRooms, ROOM_MODELS } from './rooms.js';
import { Resident } from '../models/Resident.js';
import { Due } from '../models/Due.js';
import { Payment } from '../models/Payment.js';
import { Complaint } from '../models/Complaint.js';
import { Warning } from '../models/Warning.js';
import { Notification } from '../models/Notification.js';
import { Media } from '../models/Media.js';
import { ResidentDocument } from '../models/ResidentDocument.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { Meeting } from '../models/Meeting.js';
import { Visitor, VisitorLifetime } from '../models/Visitor.js';
import { BlogPost } from '../models/BlogPost.js';
import { BlogComment, BlogLike, BlogBookmark, CommentReport } from '../models/BlogComment.js';
import { Event } from '../models/Event.js';

const STAFF = [
  { role: ROLES.SUPER_ADMIN, prefix: 'SEED_SUPER_ADMIN', fallbackName: 'Super Admin', required: true },
  { role: ROLES.OWNER, prefix: 'SEED_OWNER', fallbackName: 'Owner' },
  { role: ROLES.ADMIN, prefix: 'SEED_ADMIN', fallbackName: 'Admin' },
  { role: ROLES.MANAGER, prefix: 'SEED_MANAGER', fallbackName: 'Manager' },
];

async function seedRoles() {
  for (const key of ROLE_LIST) {
    const existing = await Role.findOne({ key });
    if (existing) {
      // Never overwrite permissions that an administrator may have customised.
      console.info(`  • role ${key}: already exists (kept)`);
      continue;
    }
    await Role.create({
      key,
      name: ROLE_LABELS[key],
      description: ROLE_DESCRIPTIONS[key],
      level: ROLE_LEVELS[key],
      permissions: DEFAULT_ROLE_PERMISSIONS[key],
    });
    console.info(`  • role ${key}: created`);
  }
}

async function seedStaffUsers() {
  for (const s of STAFF) {
    const email = process.env[`${s.prefix}_EMAIL`]?.trim();
    const password = process.env[`${s.prefix}_PASSWORD`];
    const name = process.env[`${s.prefix}_NAME`]?.trim() || s.fallbackName;

    if (!email || !password) {
      if (s.required) throw new Error(`${s.prefix}_EMAIL and ${s.prefix}_PASSWORD must be set in server/.env to seed the ${s.role}.`);
      console.info(`  • ${s.role}: skipped (no ${s.prefix}_EMAIL / ${s.prefix}_PASSWORD)`);
      continue;
    }

    const emailCheck = emailSchema.safeParse(email);
    const pwCheck = passwordSchema.safeParse(password);
    if (!emailCheck.success) throw new Error(`${s.prefix}_EMAIL is not a valid email.`);
    if (!pwCheck.success) throw new Error(`${s.prefix}_PASSWORD is too weak: ${pwCheck.error.issues[0].message}`);

    const existing = await User.findOne({ email: emailCheck.data });
    if (existing) {
      console.info(`  • ${s.role} (${emailCheck.data}): already exists (kept, password untouched)`);
      continue;
    }
    await User.create({
      name,
      email: emailCheck.data,
      passwordHash: await hashPassword(password),
      role: s.role,
      emailVerified: true,
      isActive: true,
    });
    console.info(`  • ${s.role} (${emailCheck.data}): created`);
  }
}

async function seedSettings() {
  const exists = await SiteSetting.exists({ key: 'main' });
  if (exists) return console.info('  • site settings: already exist (kept)');
  await SiteSetting.create({
    key: 'main',
    general: {
      hostelName: 'Digital Hostel',
      tagline: 'Safe, comfortable and connected student living',
      description: 'A modern hostel for students and professionals. Update this text from the admin settings.',
    },
  });
  console.info('  • site settings: created with defaults');
}

async function run() {
  console.info(`[seed] Environment: ${config.NODE_ENV}`);
  await connectDB();
  console.info('[seed] Roles');
  await seedRoles();
  console.info('[seed] Staff users');
  await seedStaffUsers();
  console.info('[seed] Site settings');
  await seedSettings();
  console.info('[seed] Website content');
  await seedContent();
  console.info('[seed] Rooms & beds');
  await seedRooms();
  // Build indexes explicitly so production (autoIndex off) is ready after seeding.
  console.info('[seed] Syncing indexes');
  await Promise.all([
    User.syncIndexes(), Role.syncIndexes(), SiteSetting.syncIndexes(),
    Session.syncIndexes(), LoginHistory.syncIndexes(), AuditLog.syncIndexes(),
    ...CONTENT_MODELS.map((m) => m.syncIndexes()),
    ...ROOM_MODELS.map((m) => m.syncIndexes()),
    ...[Resident, Due, Payment, Complaint, Warning, Notification, Media, Event, ResidentDocument, SupportTicket, Meeting, Visitor, VisitorLifetime, BlogPost, BlogComment, BlogLike, BlogBookmark, CommentReport].map((m) => m.syncIndexes()),
  ]);
  console.info('[seed] Done. Sample content and rooms created (only where empty).');
}

run()
  .then(() => disconnectDB())
  .catch(async (err) => {
    console.error(`[seed] Failed: ${err.message}`);
    await disconnectDB().catch(() => {});
    process.exit(1);
  });
