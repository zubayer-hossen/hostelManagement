const DAY = 864e5;
export const UPCOMING_DAYS = 3;
export const OVERDUE_REPEAT_DAYS = 7;

/** Which reminder (if any) a due needs right now. Pure so it can be unit-tested. */
export function dueReminderKind(due, now = new Date()) {
  if (due.isVoid || due.status === 'void' || due.status === 'paid') return null;
  if (due.amount - due.paidAmount <= 0.005) return null;
  const last = due.lastReminderAt ? new Date(due.lastReminderAt) : null;
  const dueDate = new Date(due.dueDate);
  if (dueDate < now) return !last || now - last >= OVERDUE_REPEAT_DAYS * DAY ? 'overdue' : null;
  if (dueDate - now <= UPCOMING_DAYS * DAY) return last ? null : 'upcoming';
  return null;
}
