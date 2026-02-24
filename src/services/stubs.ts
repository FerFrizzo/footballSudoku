import { trackEvent } from './analytics';

export const AdsService = {
  async showInterstitial(userId?: string | null, deviceId?: string): Promise<void> {
    await trackEvent('ad_interstitial_shown', {}, userId, deviceId);
    return new Promise((resolve) => setTimeout(resolve, 1500));
  },
};

export const IAPService = {
  async purchasePremium(userId?: string | null, deviceId?: string): Promise<boolean> {
    await trackEvent('iap_premium_attempt', {}, userId, deviceId);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await trackEvent('iap_premium_success', {}, userId, deviceId);
    return true;
  },
};
