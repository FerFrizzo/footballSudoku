import { Platform } from 'react-native';
import {
  InterstitialAd,
  AdEventType,
  TestIds,
  mobileAds,
} from 'react-native-google-mobile-ads';

import { useGameStore } from '../state/gameStore';
import { trackEvent } from '../services/analytics';

// ---------------------------------------------------------------------------
// Ad unit IDs
// Replace EXPO_PUBLIC_ADMOB_IOS_AD_UNIT_ID and EXPO_PUBLIC_ADMOB_ANDROID_AD_UNIT_ID
// in your .env file with the interstitial ad unit IDs from your AdMob dashboard.
// Also replace the app-level IDs in app.json (androidAppId / iosAppId) before
// submitting to the stores.
// ---------------------------------------------------------------------------
const AD_UNIT_ID = Platform.select({
  ios: __DEV__
    ? TestIds.INTERSTITIAL
    : (process.env.EXPO_PUBLIC_ADMOB_IOS_AD_UNIT_ID ?? ''),
  android: __DEV__
    ? TestIds.INTERSTITIAL
    : (process.env.EXPO_PUBLIC_ADMOB_ANDROID_AD_UNIT_ID ?? ''),
}) ?? TestIds.INTERSTITIAL;

let interstitial: InterstitialAd = InterstitialAd.createForAdRequest(AD_UNIT_ID);
let adLoaded = false;

function loadAd() {
  adLoaded = false;
  interstitial = InterstitialAd.createForAdRequest(AD_UNIT_ID);

  const unsubLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
    adLoaded = true;
    unsubLoaded();
  });

  const unsubError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
    adLoaded = false;
    unsubError();
  });

  interstitial.load();
}

export async function initializeAds(): Promise<void> {
  try {
    await mobileAds().initialize();
    loadAd();
  } catch (e) {
    console.warn('[Ads] Failed to initialize:', e);
  }
}

/**
 * Called after every completed game. Shows an interstitial only on every 2nd
 * call (never before, never after). Resolves once the ad closes (or is
 * skipped if not loaded), so navigation is never blocked indefinitely.
 */
export function showInterstitialIfDue(
  userId?: string | null,
  deviceId?: string
): Promise<void> {
  return new Promise((resolve) => {
    const shouldShow = useGameStore.getState().incrementGamesCompleted();

    if (!shouldShow || !adLoaded) {
      resolve();
      return;
    }

    const unsubClose = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      unsubClose();
      loadAd();
      resolve();
    });

    const unsubError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
      unsubError();
      resolve();
    });

    trackEvent('ad_interstitial_shown', {}, userId, deviceId);
    interstitial.show().catch(() => resolve());
  });
}
