import React, { createContext, useContext } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { useMutation, useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';

const REVENUECAT_TEST_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

export const REVENUECAT_ENTITLEMENT_IDENTIFIER = 'premium';

/** Set to true only after Purchases.configure() runs successfully. */
export let isRevenueCatConfigured = false;

/** True when running in Expo Go or dev — must use Test Store API key only. */
function mustUseTestStoreKey(): boolean {
  return (
    __DEV__ ||
    Platform.OS === 'web' ||
    Constants.executionEnvironment === 'storeClient'
  );
}

function getRevenueCatApiKey(): string | null {
  // In Expo Go / dev we must use the Test Store key only (native keys are invalid).
  if (mustUseTestStoreKey()) {
    return REVENUECAT_TEST_API_KEY ?? null;
  }

  if (!REVENUECAT_TEST_API_KEY || !REVENUECAT_IOS_API_KEY || !REVENUECAT_ANDROID_API_KEY) {
    return null;
  }

  if (Platform.OS === 'ios') {
    return REVENUECAT_IOS_API_KEY;
  }

  if (Platform.OS === 'android') {
    return REVENUECAT_ANDROID_API_KEY;
  }

  return REVENUECAT_TEST_API_KEY;
}

export function initializeRevenueCat() {
  try {
    const apiKey = getRevenueCatApiKey();
    if (!apiKey) {
      console.warn(
        'RevenueCat skipped: add EXPO_PUBLIC_REVENUECAT_TEST_API_KEY (required in Expo Go/dev) and optionally iOS/Android keys to .env. Get them from RevenueCat dashboard → Project → API keys → SDK keys.',
      );
      return;
    }

    // In Expo Go the key must be the Test Store key (starts with "test_"). iOS/Android keys are invalid here.
    if (mustUseTestStoreKey() && !apiKey.startsWith('test_')) {
      console.warn(
        `RevenueCat: EXPO_PUBLIC_REVENUECAT_TEST_API_KEY should be the Test Store key (starts with "test_"). Yours starts with "${apiKey.slice(0, 8)}...". In Expo Go use only the key from RevenueCat → API keys → SDK keys → "Test Store" (Show key). Then restart the dev server.`,
      );
    }

    if (__DEV__) {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    }
    Purchases.configure({ apiKey });
    isRevenueCatConfigured = true;
    console.log('Configured RevenueCat');
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('Test Store') || message.includes('Invalid API key')) {
      console.warn(
        'RevenueCat: Use the Test Store key (starts with "test_") from RevenueCat → API keys → SDK keys → "Test Store". Set EXPO_PUBLIC_REVENUECAT_TEST_API_KEY in .env, then restart the dev server (npm start) so the env is picked up.',
      );
    } else {
      console.warn('RevenueCat initialization failed:', e);
    }
  }
}

function useSubscriptionContext() {
  const customerInfoQuery = useQuery({
    queryKey: ['revenuecat', 'customer-info'],
    queryFn: async () => {
      if (!isRevenueCatConfigured) return null;
      return Purchases.getCustomerInfo();
    },
    staleTime: 60 * 1000,
    enabled: isRevenueCatConfigured,
  });

  const offeringsQuery = useQuery({
    queryKey: ['revenuecat', 'offerings'],
    queryFn: async () => {
      if (!isRevenueCatConfigured) return null;
      return Purchases.getOfferings();
    },
    staleTime: 300 * 1000,
    enabled: isRevenueCatConfigured,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (packageToPurchase: any) => {
      if (!isRevenueCatConfigured) throw new Error('RevenueCat not configured');
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return customerInfo;
    },
    onSuccess: () => customerInfoQuery.refetch(),
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (!isRevenueCatConfigured) throw new Error('RevenueCat not configured');
      return Purchases.restorePurchases();
    },
    onSuccess: () => customerInfoQuery.refetch(),
  });

  const isSubscribed =
    customerInfoQuery.data?.entitlements?.active?.[REVENUECAT_ENTITLEMENT_IDENTIFIER] !== undefined;

  return {
    customerInfo: customerInfoQuery.data ?? undefined,
    offerings: offeringsQuery.data ?? undefined,
    isSubscribed: isSubscribed ?? false,
    isLoading: isRevenueCatConfigured && (customerInfoQuery.isLoading || offeringsQuery.isLoading),
    purchase: purchaseMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
  };
}

type SubscriptionContextValue = ReturnType<typeof useSubscriptionContext>;
const Context = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const value = useSubscriptionContext();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSubscription() {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return ctx;
}
