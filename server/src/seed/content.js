import { Banner } from '../models/Banner.js';
import { Headline } from '../models/Headline.js';
import { Facility } from '../models/Facility.js';
import { FoodMenu, DAYS } from '../models/FoodMenu.js';
import { Notice } from '../models/Notice.js';
import { Faq } from '../models/Faq.js';
import { GalleryItem } from '../models/GalleryItem.js';
import { PageContent } from '../models/PageContent.js';
import { SiteSetting } from '../models/SiteSetting.js';
import { ContactMessage } from '../models/ContactMessage.js';

export const CONTENT_MODELS = [Banner, Headline, Facility, FoodMenu, Notice, Faq, GalleryItem, PageContent, ContactMessage];

const NAVIGATION = [
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

const HOME_SECTIONS = ['hero', 'headlines', 'facilities', 'notices', 'faq', 'contact'].map((key) => ({ key, enabled: true }));

const FACILITIES = [
  ['Wi-Fi', 'wifi', 'High-speed internet in rooms and common areas.'],
  ['24/7 Security', 'shield', 'Guarded entrance and controlled visitor entry.'],
  ['CCTV', 'camera', 'Cameras in corridors, entrances and common areas.'],
  ['Backup Power', 'zap', 'Generator/IPS backup for lights, fans and Wi-Fi.'],
  ['Study Room', 'book', 'Quiet, well-lit study space open all day.'],
  ['Laundry', 'shirt', 'Laundry area with washing machines.'],
  ['Dining Hall', 'utensils', 'Hygienic dining hall serving three meals and a snack.'],
  ['Common Room', 'users', 'Shared lounge for relaxing and group activities.'],
  ['Clean Water', 'droplets', 'Filtered drinking water on every floor.'],
  ['Daily Cleaning', 'sparkles', 'Rooms and common areas cleaned every day.'],
];

const MENU = {
  breakfast: [['Paratha', 'Vegetable curry', 'Tea'], ['Khichuri', 'Egg', 'Tea'], ['Bread', 'Omelette', 'Banana'], ['Luchi', 'Aloo bhaji', 'Tea'], ['Rice cake', 'Egg curry'], ['Paratha', 'Dal', 'Tea'], ['Bread', 'Jam', 'Egg', 'Tea']],
  lunch: [['Rice', 'Chicken curry', 'Dal', 'Vegetables'], ['Rice', 'Fish curry', 'Dal', 'Mixed vegetables'], ['Rice', 'Beef curry', 'Dal', 'Salad'], ['Rice', 'Egg curry', 'Dal', 'Vegetables'], ['Rice', 'Fish curry', 'Dal', 'Salad'], ['Rice', 'Chicken curry', 'Dal', 'Vegetables'], ['Polao', 'Chicken roast', 'Salad', 'Dessert']],
  snack: [['Tea', 'Biscuits'], ['Muri', 'Chanachur', 'Tea'], ['Seasonal fruit'], ['Samosa', 'Tea'], ['Tea', 'Cake'], ['Puffed rice', 'Tea'], ['Fruit salad']],
  dinner: [['Rice', 'Fish curry', 'Dal', 'Vegetables'], ['Rice', 'Chicken curry', 'Dal', 'Salad'], ['Rice', 'Egg curry', 'Dal', 'Vegetables'], ['Rice', 'Beef curry', 'Dal', 'Vegetables'], ['Rice', 'Chicken curry', 'Dal', 'Salad'], ['Rice', 'Fish curry', 'Dal', 'Vegetables'], ['Khichuri', 'Beef bhuna', 'Salad']],
};

const FAQS = [
  ['Booking', 'How do I request a room?', 'Create an account, browse the available rooms and submit a booking request. Our team reviews it and contacts you. (Online room booking opens with the next release; until then, please contact the hostel office.)'],
  ['Booking', 'Is there a security deposit?', 'Deposit and advance rules are set by the hostel management. Please ask the office for the current terms before booking.'],
  ['Rules', 'Are visitors allowed?', 'Visitors are allowed only in the designated visitor area during visiting hours. See the Hostel Rules page for details.'],
  ['Rules', 'What are the quiet hours?', 'Quiet hours are listed in the Hostel Rules & Code of Conduct. Please respect them so everyone can study and rest.'],
  ['Food', 'How many meals are provided?', 'Breakfast, lunch, an evening snack and dinner. The weekly menu is published on the Food Menu page.'],
  ['Facilities', 'Is Wi-Fi available in rooms?', 'Yes. Wi-Fi is available in rooms and common areas. Speed may vary at peak hours.'],
  ['Payment', 'How do I pay my monthly rent?', 'Payments are recorded by the hostel office. Contact the office for accepted payment methods.'],
  ['Support', 'Who do I contact in an emergency?', 'Use the emergency numbers on the Contact page. In a medical or safety emergency, call the national emergency service first.'],
];

const RULES = `## Respectful behavior
- Treat residents, staff and neighbors with courtesy.
- Harassment, bullying and discrimination are not tolerated.

## Quiet hours
- Keep noise low during the quiet hours announced by management.
- Use headphones for music, videos and calls in shared spaces.

## Cleanliness
- Keep your room and shared areas tidy.
- Dispose of waste in the bins provided.

## Guest policy
- Guests are allowed only in the visitor area during visiting hours.
- Residents are responsible for their guests.

## Security
- Do not share your room key or access card.
- Report suspicious activity to the office immediately.

## Food & dining
- Meals are served at the announced times.
- Do not waste food or take dining-hall items to rooms.

## Property & damage
- Take care of hostel property. Damage caused by a resident may be charged.

## Payments
- Rent is due by the date announced by the office. Late payment may incur a late fee.

## Complaints & discipline
- Raise concerns through the complaint system or the office.
- Rule violations may lead to a warning, and repeated violations to further action by management.

*Sample text: edit these rules from the admin panel to match your hostel policy.*`;

const TERMS = `## Admission & booking
- A room request is not a confirmed booking until approved by management.

## Payments & refunds
- Fees, deposits and refund conditions are set by management and communicated at admission.

## Cancellation
- Cancellation and notice periods are set by management.

## Resident responsibilities
- Residents must follow the Hostel Rules & Code of Conduct.

## Property damage
- Residents may be charged for damage they cause.

## Privacy & security
- Personal information is used only to manage your stay. See the Privacy Policy.

## Termination
- Management may end an accommodation for serious or repeated rule violations.

## Changes
- These terms may be updated. The "last updated" date shows the latest revision.

*Sample text for illustration only. It is not legal advice — have your final terms reviewed by a qualified professional.*`;

const PRIVACY = `## What we collect
- Account details (name, email, phone) and information you submit in forms.
- Basic, anonymous site usage information.

## How we use it
- To manage bookings, residency, support and communication.
- We do not sell personal information.

## Who can see it
- Only authorised hostel staff. Residents' private details are never published on the public site.

## Your choices
- You can update your profile at any time and ask the office to correct or remove your data where the law allows.

## Security
- Passwords are stored hashed. Access is restricted by role.

*Sample text for illustration only. It is not legal advice — have your final policy reviewed by a qualified professional.*`;

const PAGES = [
  ['about', 'About Our Hostel', `## Our story\nWe provide safe, comfortable and affordable accommodation for students and professionals.\n\n## Mission\nTo give every resident a secure home, a healthy environment and the support they need to succeed.\n\n## Vision\nA hostel community where everyone feels respected, safe and focused.\n\n## Why choose us\n- Safe, monitored premises\n- Hygienic food\n- Study-friendly environment\n- Responsive management\n\n*Sample text: edit this page from the admin panel.*`],
  ['boys', 'Boys Hostel', `## Boys hostel\nComfortable rooms, a quiet study environment, hygienic dining and reliable Wi-Fi.\n\n## Highlights\n- Secure entry and CCTV\n- Study room and common room\n- Laundry and clean drinking water\n\n*Sample text: edit this page from the admin panel.*`],
  ['girls', 'Girls Hostel', `## Girls hostel\nA safe and supportive environment with dedicated security, comfortable rooms and hygienic dining.\n\n## Highlights\n- Controlled entry and CCTV\n- Female-specific support and safety focus\n- Study room, common areas, laundry and clean drinking water\n\n*Sample text: edit this page from the admin panel.*`],
  ['rules', 'Hostel Rules & Code of Conduct', RULES],
  ['terms', 'Terms & Conditions', TERMS],
  ['privacy', 'Privacy Policy', PRIVACY],
];

async function seedIfEmpty(Model, label, docs) {
  if (await Model.estimatedDocumentCount()) return console.info(`  • ${label}: already has data (kept)`);
  await Model.insertMany(docs);
  console.info(`  • ${label}: ${docs.length} sample record(s) created`);
}

export async function seedContent() {
  await seedIfEmpty(Banner, 'banners', [
    { title: 'Admissions are open', subtitle: 'Safe, comfortable student living', description: 'Explore our facilities and get in touch to reserve your place.', ctaText: 'Contact us', ctaLink: '/contact', secondaryCtaText: 'See facilities', secondaryCtaLink: '/facilities', order: 1 },
    { title: 'Good food, every day', subtitle: 'Fresh, hygienic meals', description: 'Breakfast, lunch, snack and dinner — see this week’s menu.', ctaText: 'View food menu', ctaLink: '/food-menu', order: 2 },
  ]);
  await seedIfEmpty(Headline, 'headlines', [
    { text: '📢 New admission open', link: '/contact', priority: 3 },
    { text: '🍽️ Weekly food menu updated', link: '/food-menu', priority: 2 },
    { text: '📌 Please read the hostel rules', link: '/rules', priority: 1 },
  ]);
  await seedIfEmpty(Facility, 'facilities', FACILITIES.map(([name, icon, description], i) => ({ name, icon, description, order: i + 1 })));

  const menu = [];
  DAYS.forEach((day, d) => {
    for (const meal of Object.keys(MENU)) menu.push({ hostelType: 'all', day, meal, items: MENU[meal][d] });
  });
  await seedIfEmpty(FoodMenu, 'food menu', menu);

  await seedIfEmpty(Faq, 'FAQ', FAQS.map(([category, question, answer], i) => ({ category, question, answer, order: i + 1, isFeatured: i < 4 })));
  await seedIfEmpty(Notice, 'notices', [
    { title: 'Welcome to the new session', body: 'New residents please complete registration at the office and read the hostel rules.', priority: 'important', isPinned: true },
    { title: 'Water tank cleaning', body: 'Routine cleaning will be done this weekend. Water may be unavailable for a short time.', priority: 'normal' },
  ]);
  // Gallery is intentionally not seeded: it needs real photos (upload/URL from the admin panel).

  for (const [key, title, content] of PAGES) {
    await PageContent.updateOne({ key }, { $setOnInsert: { key, title, content } }, { upsert: true });
  }
  console.info(`  • pages: ${PAGES.length} default page(s) ensured`);

  // Navigation & homepage sections live in site settings; only fill them if never customised.
  await SiteSetting.updateOne({ key: 'main', navigation: { $exists: false } }, { $set: { navigation: NAVIGATION } });
  await SiteSetting.updateOne({ key: 'main', homeSections: { $exists: false } }, { $set: { homeSections: HOME_SECTIONS } });
  console.info('  • navigation & homepage sections: defaults ensured');
}
