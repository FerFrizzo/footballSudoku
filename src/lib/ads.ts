import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { useGameStore } from '../state/gameStore';
import { trackEvent } from '../services/analytics';

// react-native-google-mobile-ads requires native code unavailable in Expo Go.
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// ---------------------------------------------------------------------------
// Ad unit IDs
// ---------------------------------------------------------------------------
function getAdUnitId(): string {
  if (isExpoGo) return '';
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TestIds } = require('react-native-google-mobile-ads');
  return (
    Platform.select({
      ios: __DEV__
        ? TestIds.INTERSTITIAL
        : (process.env.EXPO_PUBLIC_ADMOB_IOS_AD_UNIT_ID ?? ''),
      android: __DEV__
        ? TestIds.INTERSTITIAL
        : (process.env.EXPO_PUBLIC_ADMOB_ANDROID_AD_UNIT_ID ?? ''),
    }) ?? TestIds.INTERSTITIAL
  );
}

let interstitial: any = null;
let adLoaded = false;

function loadAd() {
  if (isExpoGo) return;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { InterstitialAd, AdEventType } = require('react-native-google-mobile-ads');
  adLoaded = false;
  interstitial = InterstitialAd.createForAdRequest(getAdUnitId());

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
  if (isExpoGo) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { mobileAds } = require('react-native-google-mobile-ads');
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

    if (isExpoGo || !shouldShow || !adLoaded) {
      resolve();
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AdEventType } = require('react-native-google-mobile-ads');

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
