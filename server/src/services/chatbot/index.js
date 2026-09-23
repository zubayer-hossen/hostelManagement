import { Facility } from '../../models/Facility.js';
import { FoodMenu, DAYS } from '../../models/FoodMenu.js';
import { Faq } from '../../models/Faq.js';
import { Notice } from '../../models/Notice.js';
import { Event } from '../../models/Event.js';
import { PageContent } from '../../models/PageContent.js';
import { activeWindow } from '../../utils/schemaOptions.js';
import { HANDOFF_BN, HANDOFF_EN, bestFaq, detectIntent, isBangla } from '../../utils/chatIntent.js';
import { getStats } from '../roomService.js';
import { getSettings } from '../settingsService.js';
import { getConfig } from '../meetingService.js';
import { config } from '../../config/env.js';
import { askAi } from './aiProvider.js';

const price = (n) => (typeof n === 'number' ? `৳${n.toLocaleString('en-US')}` : '—');
const L = (bn, en, text) => (bn ? text.bn : text.en);
const link = (label, path) => ({ label, path });

/** Everything the bot may say comes from public, admin-published data. No private or account data is ever read. */
async function knowledge(intent, message, bn) {
  const settings = await getSettings();
  const hostel = settings.general.hostelName;
  const c = settings.contact;

  switch (intent) {
    case 'greeting':
      return { facts: `Greeting from ${hostel}.`, text: L(bn, 0, { en: `Hello! I'm the ${hostel} assistant. Ask me about rooms, prices, facilities, food, rules or how to contact us.`, bn: `হ্যালো! আমি ${hostel}-এর সহকারী। রুম, ভাড়া, সুবিধা, খাবার, নিয়ম বা যোগাযোগ সম্পর্কে জিজ্ঞাসা করুন।` }), links: [] };
    case 'thanks':
      return { facts: 'User said thanks.', text: L(bn, 0, { en: 'You are welcome! Anything else I can help with?', bn: 'আপনাকেও ধন্যবাদ! আর কিছু জানতে চান?' }), links: [] };
    case 'rooms': case 'price': case 'availability': {
      const s = await getStats();
      const line = (k, name) => (s[k].rooms ? `${name}: ${s[k].rooms} rooms, ${s[k].availableBeds} of ${s[k].totalBeds} beds free, from ${price(s[k].minPrice)} per bed per month` : null);
      const lines = [line('boys', 'Boys hostel'), line('girls', 'Girls hostel')].filter(Boolean);
      if (!lines.length) return { facts: 'No rooms are published yet.', text: L(bn, 0, { en: 'Room information has not been published yet. Please contact the office.', bn: 'রুমের তথ্য এখনো প্রকাশিত হয়নি। অনুগ্রহ করে অফিসে যোগাযোগ করুন।' }), links: [link('Contact', '/contact')] };
      return { facts: lines.join('\n'), text: `${lines.join('\n')}\n${L(bn, 0, { en: 'See every room, photos and live availability on the Rooms page.', bn: 'সব রুম, ছবি ও সরাসরি সিটের অবস্থা রুম পেজে দেখুন।' })}`, links: [link('Rooms', '/rooms')] };
    }
    case 'facilities': {
      const list = await Facility.find({ isActive: true }).sort({ order: 1 }).limit(14).select('name');
      if (!list.length) return null;
      const names = list.map((f) => f.name).join(', ');
      return { facts: `Facilities: ${names}`, text: `${L(bn, 0, { en: 'Our facilities:', bn: 'আমাদের সুবিধাসমূহ:' })} ${names}.`, links: [link('Facilities', '/facilities')] };
    }
    case 'food': {
      const { utcOffsetMinutes } = await getConfig();
      const idx = new Date(Date.now() + utcOffsetMinutes * 60000).getUTCDay(); // 0 = Sunday
      const day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][idx];
      const rows = await FoodMenu.find({ isActive: true, hostelType: 'all', day });
      if (!rows.length || !DAYS.includes(day)) return { facts: 'No menu published.', text: L(bn, 0, { en: 'The menu has not been published yet.', bn: 'মেনু এখনো প্রকাশিত হয়নি।' }), links: [link('Food menu', '/food-menu')] };
      const order = ['breakfast', 'lunch', 'snack', 'dinner'];
      const text = order.map((m) => rows.find((r) => r.meal === m)).filter(Boolean).map((r) => `${r.meal}: ${r.items.join(', ')}`).join('\n');
      return { facts: `Today's menu (${day}):\n${text}`, text: `${L(bn, 0, { en: "Today's menu:", bn: 'আজকের মেনু:' })}\n${text}`, links: [link('Food menu', '/food-menu')] };
    }
    case 'rules': {
      const page = await PageContent.findOne({ key: 'rules' });
      const heads = (page?.content || '').split('\n').filter((l) => l.startsWith('## ')).map((l) => l.slice(3)).slice(0, 10);
      if (!heads.length) return null;
      return { facts: `Rules sections: ${heads.join(', ')}`, text: `${L(bn, 0, { en: 'Our code of conduct covers:', bn: 'আমাদের আচরণবিধিতে আছে:' })} ${heads.join(', ')}.`, links: [link('Hostel rules', '/rules')] };
    }
    case 'contact': case 'location': {
      const parts = [c.phone && `Phone: ${c.phone}`, c.email && `Email: ${c.email}`, settings.general.address && `Address: ${settings.general.address}`, c.officeHours && `Office hours: ${c.officeHours}`, c.emergencyPhone && `Emergency: ${c.emergencyPhone}`].filter(Boolean);
      if (!parts.length) return { facts: 'No contact details published.', text: L(bn, 0, { en: 'Contact details have not been added yet.', bn: 'যোগাযোগের তথ্য এখনো যোগ করা হয়নি।' }), links: [link('Contact', '/contact')] };
      return { facts: parts.join('\n'), text: parts.join('\n'), links: [link('Contact & map', '/contact')] };
    }
    case 'booking': {
      const text = L(bn, 0, {
        en: `To reserve a bed: create an account, open the Rooms page, choose a room with free beds and send a request. A bed is held for you for ${config.BOOKING_HOLD_DAYS} days while the hostel reviews it, and you are notified of the decision. I cannot book for you myself.`,
        bn: `সিট নিতে: অ্যাকাউন্ট খুলুন, রুম পেজে খালি সিট আছে এমন রুম বেছে অনুরোধ পাঠান। হোস্টেল যাচাই করার সময় ${config.BOOKING_HOLD_DAYS} দিন সিটটি আপনার জন্য ধরে রাখা হয় এবং সিদ্ধান্ত জানানো হয়। আমি নিজে বুকিং করে দিতে পারি না।`,
      });
      return { facts: text, text, links: [link('Rooms', '/rooms'), link('Register', '/register')] };
    }
    case 'support': {
      const text = L(bn, 0, { en: 'You can send a support request from the Support page — no account needed — and follow it with your ticket code. For emergencies use the emergency numbers on the Contact page.', bn: 'সাপোর্ট পেজ থেকে অনুরোধ পাঠাতে পারেন — অ্যাকাউন্ট লাগবে না — এবং টিকিট কোড দিয়ে অনুসরণ করতে পারবেন। জরুরি অবস্থায় যোগাযোগ পেজের জরুরি নম্বর ব্যবহার করুন।' });
      return { facts: text, text, links: [link('Support', '/support'), link('Contact', '/contact')] };
    }
    case 'meeting': {
      const m = await getConfig();
      const text = L(bn, 0, { en: `Signed-in users can book a ${m.slotMinutes}-minute meeting with the manager on the Meetings page. I cannot book it for you.`, bn: `লগইন করা ব্যবহারকারীরা মিটিং পেজে ম্যানেজারের সাথে ${m.slotMinutes} মিনিটের মিটিং বুক করতে পারেন। আমি বুক করে দিতে পারি না।` });
      return { facts: text, text, links: [link('Meetings', '/meetings')] };
    }
    case 'notices': {
      const list = await Notice.find({ isActive: true, audience: { $in: ['everyone', 'boys', 'girls'] }, publishAt: { $lte: new Date() }, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }).sort({ isPinned: -1, publishAt: -1 }).limit(3).select('title');
      if (!list.length) return { facts: 'No notices.', text: L(bn, 0, { en: 'There are no public notices right now.', bn: 'এখন কোনো প্রকাশ্য নোটিশ নেই।' }), links: [link('Notices', '/notices')] };
      const t = list.map((n) => `• ${n.title}`).join('\n');
      return { facts: `Latest notices:\n${t}`, text: `${L(bn, 0, { en: 'Latest notices:', bn: 'সর্বশেষ নোটিশ:' })}\n${t}`, links: [link('Notices', '/notices')] };
    }
    case 'events': {
      const now = new Date();
      const list = await Event.find({ ...activeWindow('__none__', '__none__', now), $or: [{ endsAt: { $gte: now } }, { endsAt: null, startsAt: { $gte: now } }] }).sort({ startsAt: 1 }).limit(3).select('title startsAt');
      if (!list.length) return { facts: 'No upcoming events.', text: L(bn, 0, { en: 'There are no upcoming events at the moment.', bn: 'এই মুহূর্তে কোনো আসন্ন অনুষ্ঠান নেই।' }), links: [link('Events', '/events')] };
      const t = list.map((e) => `• ${e.title} — ${e.startsAt.toISOString().slice(0, 10)}`).join('\n');
      return { facts: `Upcoming events:\n${t}`, text: `${L(bn, 0, { en: 'Upcoming events:', bn: 'আসন্ন অনুষ্ঠান:' })}\n${t}`, links: [link('Events', '/events')] };
    }
    default:
      return null;
  }
}

const handoff = (bn) => ({ reply: bn ? HANDOFF_BN : HANDOFF_EN, links: [link(bn ? 'সাপোর্ট' : 'Support', '/support'), link(bn ? 'মিটিং' : 'Meetings', '/meetings')], source: 'fallback' });

/**
 * ChatbotService.answer — order: built-in knowledge for the detected intent → FAQ match → honest hand-off.
 * If an AI provider is configured it may rephrase the answer from the same facts; on any failure the built-in answer is used.
 * The bot never claims to perform actions it cannot perform.
 */
export async function answer({ message }) {
  const text = String(message || '').trim().slice(0, 500);
  const bn = isBangla(text);
  const intent = detectIntent(text);
  if (intent === 'empty') return { reply: bn ? 'কীভাবে সাহায্য করতে পারি?' : 'How can I help you?', links: [], source: 'knowledge' };

  let result = await knowledge(intent, text, bn);
  let source = 'knowledge';

  if (!result) {
    const faqs = await Faq.find({ isActive: true }).select('question answer category').limit(300);
    const hit = bestFaq(text, faqs);
    if (hit) { result = { facts: `Q: ${hit.faq.question}\nA: ${hit.faq.answer}`, text: hit.faq.answer, links: [link('FAQ', '/faq')] }; source = 'faq'; }
  }
  if (!result) return handoff(bn);

  const ai = await askAi({ message: text, facts: result.facts, hostelName: (await getSettings()).general.hostelName });
  if (ai) return { reply: ai, links: result.links, source: 'ai' };
  return { reply: result.text, links: result.links, source };
}
