// Billing Configuration - Product and entitlement identifiers for RevenueCat

import { Capacitor } from '@capacitor/core';

// Entitlement identifier - matches RevenueCat dashboard
export const ENTITLEMENT_ID = 'npd Pro';

// Product identifiers - matches RevenueCat dashboard and store products
export const BILLING_CONFIG = {
  weekly: {
    productId: 'nnppd_weekly:nnnpd-weekly',
    basePlanId: 'nnnpd-weekly',
  },
  monthly: {
    productId: 'npd_mo:npd-mo',
    basePlanId: 'npd-mo',
    trialOfferId: 'npd-monthly-offer',
  },
  yearly: {
    productId: 'npd_yr:npd-yearly-plan',
    basePlanId: 'npd-yearly-plan',
    trialOfferId: 'npd-yearly-trial',
  },
} as const;

export type PlanType = keyof typeof BILLING_CONFIG;

export interface SubscriptionProduct {
  productId: string;
  basePlanId?: string;
  purchaseOptionId?: string;
}

export const getSubscriptionDetails = (plan: PlanType): SubscriptionProduct => {
  return BILLING_CONFIG[plan];
};

// Stripe Payment Links for web purchases
export const STRIPE_PAYMENT_LINKS: Record<PlanType, string> = {
  weekly: 'https://buy.stripe.com/7sY14n7WX15lbLraEjgfu00',
  monthly: 'https://buy.stripe.com/7sYfZh911cO302JaEjgfu01',
  yearly: 'https://buy.stripe.com/fZuaEX5OP8xNdTz3bRgfu02',
};

// Stripe Price IDs
export const STRIPE_PRICE_IDS: Record<PlanType, string> = {
  weekly: 'price_1TNY0ZFAPtKh08jGLnp6RBqy',
  monthly: 'price_1TNY13FAPtKh08jGUybjx3uC',
  yearly: 'price_1TNY1CFAPtKh08jGscKXlbzA',
};

// Pricing display (for UI only - actual pricing comes from RevenueCat/Store)
export const PRICING_DISPLAY = {
  weekly: {
    price: '$8.99',
    period: 'week',
    displayPrice: '$8.99/wk',
  },
  monthly: {
    price: '$12.99',
    period: 'month',
    displayPrice: '$12.99/mo',
  },
  yearly: {
    price: '$96.99',
    period: 'year',
    displayPrice: '$96.99/yr',
  },
} as const;

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};
