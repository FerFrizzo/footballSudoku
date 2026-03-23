import { showInterstitialIfDue } from '../lib/ads';

export const AdsService = {
  showInterstitial: showInterstitialIfDue,
};

export const IAPService = {
  async purchasePremium(userId?: string | null, deviceId?: string): Promise<boolean> {
    await trackEvent('iap_premium_attempt', {}, userId, deviceId);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await trackEvent('iap_premium_success', {}, userId, deviceId);
    return true;
  },
};
