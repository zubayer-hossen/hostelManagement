/** Pure language helpers for the chatbot (English + Bangla keywords). */
export const HANDOFF_EN = 'I can help with general information. For this issue, please create a support ticket or request a manager meeting.';
export const HANDOFF_BN = 'আমি সাধারণ তথ্য দিয়ে সাহায্য করতে পারি। এই বিষয়ের জন্য অনুগ্রহ করে একটি সাপোর্ট টিকিট খুলুন অথবা ম্যানেজারের সাথে মিটিং নিন।';

export const isBangla = (text) => /[\u0980-\u09FF]/.test(text);

const INTENTS = [
  ['greeting', /\b(hi|hello|hey|salam|assalam\w*|good (morning|evening|afternoon))\b|হ্যালো|হাই|আসসালামু|সালাম|নমস্কার/i],
  ['thanks', /\b(thanks?|thank you|thx)\b|ধন্যবাদ|শুকরিয়া/i],
  ['meeting', /\b(book\s+a\s+meeting|schedule\s+a\s+meeting|meeting|meet|appointment|manager)\b|মিটিং|সাক্ষাৎ|অ্যাপয়েন্টমেন্ট|ম্যানেজার/i],
  ['booking', /\b(book(ing)?|reserve|reservation|admission|admit|apply|join|move[- ]?in|how (do|to) i (get|take))\b|বুকিং|ভর্তি|সিট নিত|সিট পেত|আবেদন|রিজার্ভ/i],
  ['facilities', /\b(facilit\w*|wifi|wi-fi|internet|laundry|security|cctv|generator|study|parking|amenit\w*|service)\b|সুবিধা|ওয়াইফাই|লন্ড্রি|নিরাপত্তা/i],
  ['availability', /\b(available|availability|vacan\w*|free (bed|seat|room)s?|any (bed|seat|room))\b|খালি|সিট আছে|ভ্যাকেন্ট/i],
  ['price', /\b(price|cost|rent|fee|fees|charge|charges|how much|monthly)\b|ভাড়া|খরচ|ফি|দাম|কত টাকা/i],
  ['rooms', /\b(room|rooms|bed|beds|dorm|dormitory|single|double|triple|ac)\b|রুম|কক্ষ|সিট|বেড/i],
  ['food', /\b(food|meal|menu|breakfast|lunch|dinner|snack|eat|dining|canteen)\b|খাবার|মেনু|নাস্তা|দুপুর|রাতের|খাওয়া/i],
  ['rules', /\b(rule|rules|policy|policies|conduct|curfew|visitor|guest|smoking|quiet hours?)\b|নিয়ম|বিধি|আচরণ|অতিথি|কার্ফিউ/i],
  ['contact', /\b(contact|phone|call|email|e-mail|number|office|hours|open|whatsapp|emergency)\b|যোগাযোগ|ফোন|নম্বর|ইমেইল|অফিস|জরুরি/i],
  ['location', /\b(where|location|address|map|direction\w*|how to reach|nearby|landmark)\b|ঠিকানা|কোথায়|অবস্থান|ম্যাপ|লোকেশন/i],
  ['support', /\b(support|ticket|complain\w*|problem|issue|help desk|report)\b|সাপোর্ট|অভিযোগ|সমস্যা|টিকিট/i],
  ['notices', /\b(notice|notices|announcement\w*|news)\b|নোটিশ|ঘোষণা|খবর/i],
  ['events', /\b(event|events|tour|program|seminar|workshop)\b|অনুষ্ঠান|ইভেন্ট|শিক্ষাসফর|সেমিনার/i],
];

/** First matching intent in priority order, or "unknown". */
export function detectIntent(text) {
  const s = String(text || '').trim();
  if (!s) return 'empty';
  for (const [name, rx] of INTENTS) if (rx.test(s)) return name;
  return 'unknown';
}

const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'do', 'does', 'i', 'you', 'we', 'my', 'your', 'to', 'of', 'in', 'on', 'for', 'and', 'or', 'can', 'how', 'what', 'where', 'when', 'there', 'it', 'be', 'at', 'with', 'this', 'that', 'have', 'has']);
export const tokenize = (text) => String(text || '').toLowerCase().split(/[^\p{L}\p{M}\p{N}]+/u).filter((w) => w.length > 1 && !STOP.has(w));

/** Best FAQ for a question by word overlap. Returns { faq, score } or null when nothing is close enough. */
export function bestFaq(message, faqs, minScore = 0.34) {
  const q = new Set(tokenize(message));
  if (!q.size) return null;
  let best = null;
  for (const faq of faqs) {
    const words = new Set(tokenize(`${faq.question} ${faq.category || ''}`));
    if (!words.size) continue;
    let hit = 0;
    for (const w of q) if (words.has(w)) hit += 1;
    const score = hit / Math.min(q.size, words.size);
    if (hit >= 1 && score >= minScore && (!best || score > best.score)) best = { faq, score };
  }
  return best;
}
