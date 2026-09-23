import { api, unwrap } from './client.js';

export const chatbotApi = { ask: (message) => unwrap(api.post('/chatbot', { message })) };
