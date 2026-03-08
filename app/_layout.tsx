import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { queryClient } from '@/lib/query-client';
import { ThemeProvider } from '@/src/theme/ThemeProvider';
import { useGameStore } from '@/src/state/gameStore';
import { supabase, isSupabaseConfigured } from '@/src/services/supabase';
import { trackEvent, flushQueue } from '@/src/services/analytics';
import '@/src/i18n';

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useGameStore((s) => s.isAuthenticated);
  const hasClub = useGameStore((s) => !!s.club);
  const hasHydrated = useGameStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inSetupGroup = segments[0] === '(setup)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && !hasClub && !inSetupGroup) {
      router.replace('/(setup)/club');
    } else if (isAuthenticated && hasClub && (inAuthGroup || inSetupGroup)) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, hasClub, hasHydrated, segments]);

  if (!hasHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(setup)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="division/[divisionId]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="matchday/[divisionId]/[matchdayId]"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="dialogue"
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="about"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    async function checkSession() {
      if (isSupabaseConfigured && supabase) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            useGameStore
              .getState()
              .setAuthenticated(true, session.user.id);
          }
        } catch (e) {
          console.warn('Session check failed:', e);
        }
      }
      setSessionChecked(true);
    }
    checkSession();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && sessionChecked) {
      SplashScreen.hideAsync();
      const deviceId = useGameStore.getState().deviceId;
      trackEvent('app_open', {}, useGameStore.getState().supabaseUserId, deviceId);
      flushQueue();
    }
  }, [fontsLoaded, fontError, sessionChecked]);

  if ((!fontsLoaded && !fontError) || !sessionChecked) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView>
          <KeyboardProvider>
            <ThemeProvider>
              <AuthGate>
                <RootLayoutNav />
              </AuthGate>
            </ThemeProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F0',
  },
});
