export const round2 = (n) => Math.round(n * 100) / 100;
/** Tolerance for comparing decimal money amounts. */
export const EPS = 0.005;

/** Status from amounts: paid / partially_paid / overdue (unpaid and past due) / due. */
export const computeDueStatus = ({ amount, paidAmount, dueDate }, now = new Date()) => {
  if (paidAmount >= amount - EPS) return 'paid';
  if (paidAmount > 0) return 'partially_paid';
  return dueDate < now ? 'overdue' : 'due';
};
