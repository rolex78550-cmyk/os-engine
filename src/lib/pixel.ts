/**
 * Meta Pixel event tracking helper.
 * Fires standard Meta Pixel events for key user actions.
 */

declare global {
  interface Window {
    fbq?: any;
  }
}

/** Fire a Meta Pixel event (safely — won't crash if pixel not loaded). */
export function trackEvent(event: string, params?: Record<string, any>) {
  try {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', event, params || {});
      console.log('[Pixel] Tracked:', event, params || {});
    }
  } catch (e) {
    // Silent fail — pixel tracking is non-critical
  }
}

/**
 * Track user signup (Lead event).
 * Call this when a user successfully signs up.
 */
export function trackSignup() {
  trackEvent('Lead', {
    content_name: 'Signup',
    value: 0,
    currency: 'INR',
  });
}

/**
 * Track subscription purchase.
 * Call this when a payment succeeds.
 */
export function trackPurchase(planType: string, amount: number) {
  trackEvent('Purchase', {
    content_name: planType + '_subscription',
    content_type: 'subscription',
    value: amount,
    currency: 'INR',
  });
}

/**
 * Track when user views the pricing page.
 */
export function trackPricingView() {
  trackEvent('InitiateCheckout', {
    content_name: 'Pricing Page',
  });
}
