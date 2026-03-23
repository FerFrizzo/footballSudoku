import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase, isSupabaseConfigured } from './supabase';
import { useGameStore } from '../state/gameStore';
import type { AnalyticsEvent } from '../types';

const QUEUE_KEY = 'analytics_queue';

export async function trackEvent(
  eventName: string,
  payload: Record<string, unknown> = {},
  userId?: string | null,
  deviceId?: string
): Promise<void> {
  if (!useGameStore.getState().analyticsEnabled) return;

  const event: AnalyticsEvent & { userId?: string | null; deviceId?: string } = {
    eventName,
    payload,
    createdAt: new Date().toISOString(),
    userId: userId || null,
    deviceId: deviceId || 'unknown',
  };

  try {
    const existing = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: AnalyticsEvent[] = existing ? JSON.parse(existing) : [];
    queue.push(event);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('Failed to queue analytics event:', e);
  }

  flushQueue().catch(() => {});
}

export async function flushQueue(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return;

  try {
    const existing = await AsyncStorage.getItem(QUEUE_KEY);
    if (!existing) return;

    const queue: (AnalyticsEvent & { userId?: string | null; deviceId?: string })[] =
      JSON.parse(existing);
    if (queue.length === 0) return;

    const rows = queue.map((e) => ({
      user_id: e.userId || null,
      device_id: e.deviceId || 'unknown',
      event_name: e.eventName,
      payload_json: e.payload,
      created_at: e.createdAt,
    }));

    const { error } = await supabase.from('analytics_events').insert(rows);

    if (!error) {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([]));
    }
  } catch (e) {
    console.warn('Failed to flush analytics queue:', e);
  }
}
