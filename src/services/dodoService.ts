import { isCountryIndia } from '../lib/payments';
import { PlanType } from '../types';

export interface DodoCheckoutOptions {
  checkoutId?: string;
  checkoutUrl?: string;
  mode?: 'test' | 'live';
}

/**
 * Ensures Dodo Payments SDK script is loaded lazily.
 * STRICT REQUIREMENT: Never load the SDK for Indian users.
 */
export async function loadDodoSDK(country?: string | null, mode: 'test' | 'live' = 'test'): Promise<boolean> {
  if (typeof window === 'undefined') {
    console.warn('[DodoSDK] Server-side window context detected. Bypassing SDK load.');
    return false;
  }

  console.log(`[DodoSDK] loadDodoSDK requested. Country: "${country}", Mode: "${mode}"`);

  // STRICT REQUIREMENT: If country is India, NEVER load the Dodo SDK
  if (isCountryIndia(country)) {
    console.log('[DodoSDK] User country is India. Dodo Payments SDK load bypassed.');
    return false;
  }

  // Already loaded?
  if ((window as any).DodoPayments) {
    console.log('[DodoSDK] ✅ (window as any).DodoPayments already exists on window object.');
    return true;
  }

  if (document.getElementById('dodo-payments-sdk-script')) {
    console.log('[DodoSDK] Script tag #dodo-payments-sdk-script is already present in DOM. Waiting for script readiness...');
    // Small check to verify readiness
    return new Promise((resolve) => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if ((window as any).DodoPayments) {
          clearInterval(interval);
          console.log('[DodoSDK] ✅ window.DodoPayments became available after DOM script wait.');
          resolve(true);
        } else if (attempts > 15) {
          clearInterval(interval);
          console.warn('[DodoSDK] Timed out waiting for existing script element window.DodoPayments.');
          resolve(false);
        }
      }, 100);
    });
  }

  return new Promise((resolve) => {
    try {
      const primaryUrl = mode === 'test'
        ? 'https://test.dodopayments.com/v1/checkout.js'
        : 'https://live.dodopayments.com/v1/checkout.js';

      console.log(`[DodoSDK] Injecting primary SDK script tag into document.head: ${primaryUrl}`);

      const script = document.createElement('script');
      script.id = 'dodo-payments-sdk-script';
      script.src = primaryUrl;
      script.async = true;

      script.onload = () => {
        console.log('[DodoSDK] ✅ Primary Dodo Payments SDK script tag loaded. window.DodoPayments:', (window as any).DodoPayments);
        resolve(true);
      };

      script.onerror = (e) => {
        console.warn('[DodoSDK] ⚠️ Primary SDK script URL failed to load:', primaryUrl, e);
        console.log('[DodoSDK] Attempting fallback script URL: https://checkout.dodopayments.com/v1/checkout.js');

        const fallbackScript = document.createElement('script');
        fallbackScript.id = 'dodo-payments-sdk-script-fallback';
        fallbackScript.src = 'https://checkout.dodopayments.com/v1/checkout.js';
        fallbackScript.async = true;

        fallbackScript.onload = () => {
          console.log('[DodoSDK] ✅ Fallback Dodo Payments SDK script loaded. window.DodoPayments:', (window as any).DodoPayments);
          resolve(true);
        };

        fallbackScript.onerror = (err) => {
          console.error('[DodoSDK] ❌ Fallback Dodo Payments SDK script also failed to load:', err);
          resolve(false);
        };

        document.head.appendChild(fallbackScript);
      };

      document.head.appendChild(script);
    } catch (e) {
      console.error('[DodoSDK] ❌ Error injecting Dodo SDK script:', e);
      resolve(false);
    }
  });
}

/**
 * Launches the official Dodo Payments checkout flow.
 */
export async function openDodoCheckout(options: DodoCheckoutOptions): Promise<boolean> {
  const mode = options.mode || (import.meta as any).env?.VITE_DODO_PAYMENTS_MODE || 'test';

  console.log('[DodoService] openDodoCheckout called with options:', options);
  console.log('[DodoService] Operating mode:', mode);

  // STRICT RULE: Dodo Payments utilizes secure, hosted Checkout Sessions.
  // As per official Dodo Payments documentation, we must redirect the user directly to the returned checkout_url.
  // To avoid modern browser popup blockers and iframe sandboxing issues, we must execute the redirect instantly
  // without any asynchronous delay (like script loading).
  if (options.checkoutUrl) {
    console.log('[DodoService] Opening Dodo hosted checkout URL:', options.checkoutUrl);
    const isIframe = window.self !== window.top;
    console.log('[DodoService] Context check - Is running inside iframe?:', isIframe);

    if (isIframe) {
      console.log('[DodoService] Attempting window.open popup to bypass iframe sandbox restrictions...');
      // Open in a new tab first - this is the standard way to bypass iframe payment blocks
      const popup = window.open(options.checkoutUrl, '_blank', 'noopener,noreferrer');
      if (popup && !popup.closed && typeof popup.closed !== 'undefined') {
        console.log('[DodoService] ✅ Successfully opened popup window for hosted checkout URL.');
        return true;
      }

      console.warn('[DodoService] Popup window.open failed or blocked. Trying top frame redirection...');
      try {
        if (window.top) {
          window.top.location.href = options.checkoutUrl;
          console.log('[DodoService] ✅ Set top frame location to hosted checkout URL.');
          return true;
        }
      } catch (e) {
        console.warn('[DodoService] Unable to navigate top frame due to cross-origin restriction:', e);
      }
    }

    console.log('[DodoService] Navigating current window location to checkout URL...');
    window.location.href = options.checkoutUrl;
    return true;
  }

  console.error('[DodoService] ❌ No checkout URL provided in options.');
  return false;
}
