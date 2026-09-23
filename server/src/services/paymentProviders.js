/**
 * Payment provider registry. Version 1 supports MANUAL recording only (cash, bKash/Nagad/bank transfer entered by staff).
 * To add a gateway later (bKash, Nagad, SSLCommerz, Stripe): add an entry here that implements
 *   createCheckout({ due, resident, returnUrl }) -> { redirectUrl, reference }
 *   verifyCallback(payload) -> { ok, transactionId, amount }
 * and call recordPayment() from the verified callback. Card numbers or gateway secrets are NEVER stored in the database.
 */
export const PAYMENT_PROVIDERS = Object.freeze({
  manual: { id: 'manual', label: 'Manual entry by staff', online: false },
});

export const getProvider = (id = 'manual') => PAYMENT_PROVIDERS[id] || null;
