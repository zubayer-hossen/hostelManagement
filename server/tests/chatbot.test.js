import test from 'node:test';
import assert from 'node:assert/strict';
import { detectIntent, bestFaq, isBangla, tokenize, HANDOFF_EN } from '../src/utils/chatIntent.js';

test('intents in English', () => {
  const cases = { 'hello': 'greeting', 'How much is the rent?': 'price', 'do you have free beds': 'availability', 'what is for lunch today': 'food', 'is wifi available': 'facilities',
    'where are you located': 'location', 'phone number please': 'contact', 'can I reserve a room': 'booking', 'I want to complain': 'support', 'book a meeting with the manager': 'meeting',
    'what are the rules': 'rules', 'any notice': 'notices', 'upcoming events': 'events', 'thank you': 'thanks', 'tell me a joke': 'unknown', '   ': 'empty' };
  for (const [q, want] of Object.entries(cases)) assert.equal(detectIntent(q), want, q);
});
test('intents in Bangla', () => {
  assert.equal(detectIntent('ভাড়া কত টাকা'), 'price');
  assert.equal(detectIntent('আজকের খাবারের মেনু কী'), 'food');
  assert.equal(detectIntent('ঠিকানা কোথায়'), 'location');
  assert.equal(detectIntent('বুকিং করতে চাই'), 'booking');
  assert.equal(isBangla('ভাড়া'), true);
  assert.equal(isBangla('rent'), false);
});
test('FAQ matching needs real overlap and picks the best', () => {
  const faqs = [{ question: 'How do I request a room?', category: 'Booking' }, { question: 'Are visitors allowed?', category: 'Rules' }, { question: 'Is Wi-Fi available in rooms?', category: 'Facilities' }];
  assert.equal(bestFaq('can visitors come in?', faqs).faq.question, 'Are visitors allowed?');
  assert.equal(bestFaq('quantum physics lecture', faqs), null);
  assert.equal(bestFaq('', faqs), null);
});
test('tokenizer drops stop words and keeps Bangla', () => {
  assert.deepEqual(tokenize('How do I pay the rent?'), ['pay', 'rent']);
  assert.ok(tokenize('ভাড়া কত').includes('ভাড়া'));
});
test('the mandated hand-off sentence is exact', () => {
  assert.equal(HANDOFF_EN, 'I can help with general information. For this issue, please create a support ticket or request a manager meeting.');
});
