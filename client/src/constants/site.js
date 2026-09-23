import {
  Wifi, ShieldCheck, Camera, Zap, BookOpen, Shirt, Utensils, Users, Droplets, Sparkles,
  Car, Bath, Flame, Bus, Dumbbell, Tv, Coffee, Home,
} from 'lucide-react';

/** Used when the admin has not customised navigation yet. Only pages that exist are listed. */
export const DEFAULT_NAV = [
  { key: 'home', label: 'Home', labelBn: 'হোম', path: '/', enabled: true },
  { key: 'about', label: 'About', labelBn: 'আমাদের সম্পর্কে', path: '/about', enabled: true },
  { key: 'boys', label: 'Boys Hostel', labelBn: 'ছেলেদের হোস্টেল', path: '/boys-hostel', enabled: true },
  { key: 'girls', label: 'Girls Hostel', labelBn: 'মেয়েদের হোস্টেল', path: '/girls-hostel', enabled: true },
  { key: 'rooms', label: 'Rooms', labelBn: 'রুম', path: '/rooms', enabled: true },
  { key: 'facilities', label: 'Facilities', labelBn: 'সুবিধাসমূহ', path: '/facilities', enabled: true },
  { key: 'food', label: 'Food Menu', labelBn: 'খাবারের মেনু', path: '/food-menu', enabled: true },
  { key: 'gallery', label: 'Gallery', labelBn: 'গ্যালারি', path: '/gallery', enabled: true },
  { key: 'blog', label: 'Blog', labelBn: 'ব্লগ', path: '/blog', enabled: true },
  { key: 'notices', label: 'Notices', labelBn: 'নোটিশ', path: '/notices', enabled: true },
  { key: 'events', label: 'Events', labelBn: 'অনুষ্ঠান', path: '/events', enabled: true },
  { key: 'faq', label: 'FAQ', labelBn: 'প্রশ্নোত্তর', path: '/faq', enabled: true },
  { key: 'meetings', label: 'Meetings', labelBn: 'মিটিং', path: '/meetings', enabled: true },
  { key: 'support', label: 'Support', labelBn: 'সাপোর্ট', path: '/support', enabled: true },
  { key: 'contact', label: 'Contact', labelBn: 'যোগাযোগ', path: '/contact', enabled: true },
];

export const DEFAULT_HOME_SECTIONS = ['hero', 'headlines', 'facilities', 'notices', 'faq', 'contact'].map((key) => ({ key, enabled: true }));

/** Facility `icon` names (admin-entered) -> icon components. Unknown names fall back to Sparkles. */
export const ICONS = {
  wifi: Wifi, shield: ShieldCheck, camera: Camera, zap: Zap, book: BookOpen, shirt: Shirt, utensils: Utensils,
  users: Users, droplets: Droplets, sparkles: Sparkles, car: Car, bath: Bath, flame: Flame, bus: Bus,
  dumbbell: Dumbbell, tv: Tv, coffee: Coffee, home: Home,
};

export const DAYS = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
export const MEALS = ['breakfast', 'lunch', 'snack', 'dinner'];
export const GALLERY_CATEGORIES = ['hostel', 'boys', 'girls', 'events', 'food', 'educational_tour', 'functions', 'sports', 'facilities'];
