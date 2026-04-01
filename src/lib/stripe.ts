import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-03-25.dahlia',
    });
  }
  return _stripe;
}

// Re-export as stripe for convenience
export const stripe = {
  get checkout() { return getStripe().checkout; },
  get customers() { return getStripe().customers; },
  get subscriptions() { return getStripe().subscriptions; },
  get webhooks() { return getStripe().webhooks; },
};

export const PLANS = {
  PRO: {
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    name: 'Pro',
    price: 25,
    discussions: 200,
  },
  MAX: {
    priceId: process.env.STRIPE_MAX_PRICE_ID || '',
    name: 'Max',
    price: 55,
    discussions: 750,
  },
};
