import { BarChart3, BookMarked, CalendarClock, CalendarDays, Headset, LifeBuoy as SupportIcon, ImagePlus, Images, Megaphone, Image as ImageIcon, KeyRound, Newspaper, ScrollText, Settings as SettingsIcon, Sparkles, UsersRound, Utensils, FileText, HelpCircle, AlertTriangle, BedDouble, CalendarCheck, ClipboardList, Heart, IdCard, LayoutDashboard, LifeBuoy, ShieldAlert, UserCircle, Users, Wallet } from 'lucide-react';

/**
 * Dashboard sidebar. Later phases append items here.
 * `permission` (optional) hides an item unless the user holds it — UI convenience only; the API enforces access.
 */
export const DASHBOARD_NAV = [
  { to: '/dashboard', labelKey: 'common.dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/bookings', labelKey: 'bookings.myTitle', icon: CalendarCheck },
  { to: '/dashboard/favorites', labelKey: 'rooms.favorites', icon: Heart },
  { to: '/dashboard/bookmarks', labelKey: 'blog.myBookmarks', icon: BookMarked },
  { to: '/dashboard/resident/profile', labelKey: 'resident.profileTitle', icon: IdCard, roles: ['hostel_resident'] },
  { to: '/dashboard/resident/payments', labelKey: 'finance.myTitle', icon: Wallet, roles: ['hostel_resident'] },
  { to: '/dashboard/resident/warnings', labelKey: 'warnings.myTitle', icon: AlertTriangle, roles: ['hostel_resident'] },
  { to: '/dashboard/complaints', labelKey: 'complaints.myTitle', icon: LifeBuoy, roles: ['hostel_resident'] },
  { to: '/dashboard/support', labelKey: 'support.myTitle', icon: SupportIcon },
  { to: '/dashboard/meetings', labelKey: 'meetings.myTitle', icon: CalendarClock },
  { to: '/dashboard/profile', labelKey: 'common.profile', icon: UserCircle },
  { to: '/dashboard/manage/bookings', labelKey: 'bookings.manageTitle', icon: ClipboardList, permission: 'manageBookings', group: 'nav.groups.operations' },
  { to: '/dashboard/manage/residents', labelKey: 'resident.manageTitle', icon: Users, permission: 'manageResidents', group: 'nav.groups.operations' },
  { to: '/dashboard/manage/finance', labelKey: 'finance.manageTitle', icon: Wallet, permission: 'managePayments', group: 'nav.groups.operations' },
  { to: '/dashboard/analytics', labelKey: 'visitors.title', icon: BarChart3, permission: 'viewAnalytics', group: 'nav.groups.operations' },
  { to: '/dashboard/manage/meetings', labelKey: 'meetings.manageTitle', icon: CalendarClock, permission: 'manageMeetings', group: 'nav.groups.operations' },
  { to: '/dashboard/manage/support', labelKey: 'support.manageTitle', icon: Headset, permission: 'manageSupport', group: 'nav.groups.operations' },
  { to: '/dashboard/manage/complaints', labelKey: 'complaints.manageTitle', icon: ShieldAlert, permission: 'manageComplaints', group: 'nav.groups.operations' },
  { to: '/dashboard/manage/rooms', labelKey: 'staff.roomsTitle', icon: BedDouble, permission: 'manageRooms', group: 'nav.groups.operations' },
  { to: '/dashboard/cms/banners', labelKey: 'cms.resources.banners', icon: ImageIcon, permission: 'manageBanners', group: 'nav.groups.content' },
  { to: '/dashboard/cms/headlines', labelKey: 'cms.resources.headlines', icon: Megaphone, permission: 'manageBanners', group: 'nav.groups.content' },
  { to: '/dashboard/cms/facilities', labelKey: 'cms.resources.facilities', icon: Sparkles, permission: 'manageFacilities', group: 'nav.groups.content' },
  { to: '/dashboard/cms/food-menu', labelKey: 'cms.resources.foodMenu', icon: Utensils, permission: 'manageFoodMenu', group: 'nav.groups.content' },
  { to: '/dashboard/cms/notices', labelKey: 'cms.resources.notices', icon: Newspaper, permission: 'manageNotices', group: 'nav.groups.content' },
  { to: '/dashboard/cms/events', labelKey: 'cms.resources.events', icon: CalendarDays, permission: 'manageEvents', group: 'nav.groups.content' },
  { to: '/dashboard/media', labelKey: 'media.title', icon: ImagePlus, permission: 'manageMedia', group: 'nav.groups.content' },
  { to: '/dashboard/cms/faqs', labelKey: 'cms.resources.faqs', icon: HelpCircle, permission: 'manageFAQ', group: 'nav.groups.content' },
  { to: '/dashboard/cms/gallery', labelKey: 'cms.resources.gallery', icon: Images, permission: 'manageGallery', group: 'nav.groups.content' },
  { to: '/dashboard/manage/blog', labelKey: 'blog.manageTitle', icon: Newspaper, permission: 'manageBlogs', group: 'nav.groups.content' },
  { to: '/dashboard/manage/blog/comments', labelKey: 'blog.commentsTitle', icon: Newspaper, permission: 'manageBlogs', group: 'nav.groups.content' },
  { to: '/dashboard/cms/pages', labelKey: 'cms.resources.pages', icon: FileText, permission: 'manageRules', group: 'nav.groups.content' },
  { to: '/dashboard/users', labelKey: 'admin.users.title', icon: UsersRound, permission: 'manageUsers', group: 'nav.groups.system' },
  { to: '/dashboard/roles', labelKey: 'admin.roles.title', icon: KeyRound, permission: 'manageRoles', group: 'nav.groups.system' },
  { to: '/dashboard/audit-logs', labelKey: 'admin.audit.title', icon: ScrollText, permission: 'viewAuditLogs', group: 'nav.groups.system' },
  { to: '/dashboard/settings', labelKey: 'settings.title', icon: SettingsIcon, permission: 'manageSettings', group: 'nav.groups.system' },
];
