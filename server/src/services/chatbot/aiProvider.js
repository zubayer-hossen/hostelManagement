import { config } from '../../config/env.js';

const SYSTEM = `You are the website assistant of a hostel. Answer ONLY from the FACTS provided. Be brief and friendly (max 90 words), in the user's language.
Rules: never invent prices, availability, rules or contact details. You cannot book rooms, take payments, change records or contact staff — never say or imply you did.
If the FACTS do not answer the question or it needs a person, reply exactly: "I can help with general information. For this issue, please create a support ticket or request a manager meeting."`;

/**
 * Optional AI provider (OpenAI-compatible chat completions). Returns text or null (caller falls back to the
 * built-in knowledge answer). Add another provider by adding a branch here — nothing else in the app changes.
 */
export async function askAi({ message, facts, hostelName }) {
  if (config.AI_PROVIDER !== 'openai_compatible') return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${config.AI_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.AI_API_KEY}` },
      body: JSON.stringify({
        model: config.AI_MODEL, temperature: 0.2, max_tokens: 220,
        messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: `HOSTEL: ${hostelName}\nFACTS:\n${facts}\n\nQUESTION: ${message}` }],
      }),
    });
    if (!res.ok) return null;
    const body = await res.json();
    const text = body?.choices?.[0]?.message?.content?.trim();
    return text ? text.slice(0, 900) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
