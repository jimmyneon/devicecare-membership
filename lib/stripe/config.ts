import Stripe from 'stripe';

// Only initialize Stripe on server-side
export const stripe = typeof window === 'undefined' && process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-04-10',
      typescript: true,
    })
  : null;

export const PLAN_TIERS = {
  1: {
    tier: 1,
    name: 'Starter',
    price: 10.00,
    credit: 10.00,
    stripePriceId: process.env.STRIPE_PRICE_ID_TIER_1 || '',
    features: [
      '£10 credit per month',
      'Priority queue access',
      'No upfront labour costs',
      'Credit expires in 12 months',
    ],
  },
  2: {
    tier: 2,
    name: 'Standard',
    price: 25.00,
    credit: 25.00,
    stripePriceId: process.env.STRIPE_PRICE_ID_TIER_2 || '',
    features: [
      '£25 credit per month',
      'Priority queue access',
      'No upfront labour costs',
      'Credit expires in 12 months',
      'Free basic diagnostics',
    ],
    popular: true,
  },
  3: {
    tier: 3,
    name: 'Premium',
    price: 50.00,
    credit: 50.00,
    stripePriceId: process.env.STRIPE_PRICE_ID_TIER_3 || '',
    features: [
      '£50 credit per month',
      'Priority queue access',
      'No upfront labour costs',
      'Credit expires in 12 months',
      'Free basic diagnostics',
      'Faster callbacks',
    ],
  },
  4: {
    tier: 4,
    name: 'Elite',
    price: 100.00,
    credit: 100.00,
    stripePriceId: process.env.STRIPE_PRICE_ID_TIER_4 || '',
    features: [
      '£100 credit per month',
      'Highest priority access',
      'No upfront labour costs',
      'Credit expires in 12 months',
      'Free basic diagnostics',
      'Fastest callbacks',
      'Occasional free accessories',
    ],
  },
} as const;

export const WEBHOOK_EVENTS = {
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED: 'payment_intent.payment_failed',
} as const;
