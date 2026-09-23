export const TICKET_CATEGORIES = ['general', 'room', 'booking', 'food', 'maintenance', 'payment', 'complaint', 'emergency'];
export const TICKET_PRIORITIES = ['low', 'normal', 'high', 'urgent'];
export const TICKET_STATUSES = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];

export const TICKET_TRANSITIONS = Object.freeze({
  open: ['in_progress', 'waiting', 'resolved', 'closed'],
  in_progress: ['waiting', 'resolved', 'closed'],
  waiting: ['in_progress', 'resolved', 'closed'],
  resolved: ['closed', 'in_progress'],
  closed: [],
});
export const canTicketTransition = (from, to) => (TICKET_TRANSITIONS[from] || []).includes(to);

/** Emergencies start as urgent; everything else as normal unless staff change it. */
export const defaultPriority = (category) => (category === 'emergency' ? 'urgent' : 'normal');
