/**
 * Tests for the analytics queue-and-flush service.
 *
 * All I/O dependencies (AsyncStorage, NetInfo, Supabase) are mocked so
 * tests remain fast and deterministic.
 */

// ─── Module mocks ─────────────────────────────────────────────────────────────

// In-memory store that emulates AsyncStorage key-value behaviour
const memStorage: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(memStorage[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    memStorage[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete memStorage[key];
    return Promise.resolve();
  }),
}));

const mockNetInfo = { isConnected: true };
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve(mockNetInfo)),
}));

const mockInsert = jest.fn().mockResolvedValue({ error: null });
jest.mock('../../services/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: jest.fn(() => ({ insert: mockInsert })),
  },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackEvent, flushQueue } from '../../services/analytics';

const QUEUE_KEY = 'analytics_queue';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getStoredQueue() {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

// ─── Setup / teardown ────────────────────────────────────────────────────────

beforeEach(() => {
  // Reset in-memory storage and all mocks between tests
  Object.keys(memStorage).forEach((k) => delete memStorage[k]);
  jest.clearAllMocks();
  mockInsert.mockResolvedValue({ error: null });
  mockNetInfo.isConnected = true;
});

// ─── trackEvent ───────────────────────────────────────────────────────────────

describe('trackEvent', () => {
  // Keep Supabase offline during trackEvent tests so the fire-and-forget
  // flushQueue() call inside trackEvent does not clear the queue before we assert.
  beforeEach(() => {
    mockNetInfo.isConnected = false;
  });

  it('persists an event to the AsyncStorage queue', async () => {
    await trackEvent('test_event', { foo: 'bar' });
    const queue = await getStoredQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].eventName).toBe('test_event');
  });

  it('stores the payload on the event', async () => {
    await trackEvent('level_start', { level: 3 });
    const queue = await getStoredQueue();
    expect(queue[0].payload).toEqual({ level: 3 });
  });

  it('stores a valid ISO 8601 timestamp on the event', async () => {
    await trackEvent('ping');
    const queue = await getStoredQueue();
    const ts = queue[0].createdAt;
    expect(new Date(ts).toISOString()).toBe(ts);
  });

  it('stores the userId when provided', async () => {
    await trackEvent('login', {}, 'user-abc');
    const queue = await getStoredQueue();
    expect(queue[0].userId).toBe('user-abc');
  });

  it('stores the deviceId when provided', async () => {
    await trackEvent('ping', {}, null, 'device-xyz');
    const queue = await getStoredQueue();
    expect(queue[0].deviceId).toBe('device-xyz');
  });

  it('defaults userId to null and deviceId to "unknown" when omitted', async () => {
    await trackEvent('ping');
    const queue = await getStoredQueue();
    expect(queue[0].userId).toBeNull();
    expect(queue[0].deviceId).toBe('unknown');
  });

  it('appends events to an existing queue without losing earlier ones', async () => {
    await trackEvent('first');
    await trackEvent('second');
    await trackEvent('third');
    const queue = await getStoredQueue();
    expect(queue).toHaveLength(3);
    expect(queue.map((e: any) => e.eventName)).toEqual(['first', 'second', 'third']);
  });
});

// ─── flushQueue ───────────────────────────────────────────────────────────────

describe('flushQueue', () => {
  it('returns early without calling Supabase when offline', async () => {
    mockNetInfo.isConnected = false;
    memStorage[QUEUE_KEY] = JSON.stringify([
      { eventName: 'ping', payload: {}, createdAt: new Date().toISOString() },
    ]);

    await flushQueue();

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('returns early without calling Supabase when the queue is empty', async () => {
    memStorage[QUEUE_KEY] = JSON.stringify([]);
    await flushQueue();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('returns early when there is no stored queue at all', async () => {
    await flushQueue();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('inserts all queued events into Supabase when online', async () => {
    memStorage[QUEUE_KEY] = JSON.stringify([
      { eventName: 'a', payload: {}, createdAt: '2026-01-01T00:00:00.000Z', userId: 'u1', deviceId: 'd1' },
      { eventName: 'b', payload: { x: 1 }, createdAt: '2026-01-01T00:00:01.000Z', userId: null, deviceId: 'd2' },
    ]);

    await flushQueue();

    expect(mockInsert).toHaveBeenCalledTimes(1);
    const rows = mockInsert.mock.calls[0][0];
    expect(rows).toHaveLength(2);
    expect(rows[0].event_name).toBe('a');
    expect(rows[1].event_name).toBe('b');
  });

  it('maps events to the correct db column names', async () => {
    const ts = '2026-03-01T10:00:00.000Z';
    memStorage[QUEUE_KEY] = JSON.stringify([
      { eventName: 'test', payload: { val: 42 }, createdAt: ts, userId: 'user-1', deviceId: 'dev-1' },
    ]);

    await flushQueue();

    const row = mockInsert.mock.calls[0][0][0];
    expect(row).toMatchObject({
      user_id: 'user-1',
      device_id: 'dev-1',
      event_name: 'test',
      payload_json: { val: 42 },
      created_at: ts,
    });
  });

  it('clears the queue in AsyncStorage after a successful flush', async () => {
    memStorage[QUEUE_KEY] = JSON.stringify([
      { eventName: 'ping', payload: {}, createdAt: new Date().toISOString() },
    ]);

    await flushQueue();

    const queue = await getStoredQueue();
    expect(queue).toEqual([]);
  });

  it('does NOT clear the queue when Supabase returns an error', async () => {
    mockInsert.mockResolvedValueOnce({ error: new Error('DB error') });
    memStorage[QUEUE_KEY] = JSON.stringify([
      { eventName: 'ping', payload: {}, createdAt: new Date().toISOString() },
    ]);

    await flushQueue();

    const queue = await getStoredQueue();
    expect(queue).toHaveLength(1);
  });

  it('returns early without inserting when isSupabaseConfigured is false', async () => {
    // Verify the guard: if supabase is not configured, flushQueue is a no-op.
    // We test this by temporarily replacing the mock with an unconfigured one.
    const supabaseMock = require('../../services/supabase');
    const original = supabaseMock.isSupabaseConfigured;
    supabaseMock.isSupabaseConfigured = false;

    memStorage[QUEUE_KEY] = JSON.stringify([
      { eventName: 'ping', payload: {}, createdAt: new Date().toISOString() },
    ]);

    await flushQueue();

    expect(mockInsert).not.toHaveBeenCalled();

    // Restore
    supabaseMock.isSupabaseConfigured = original;
  });
});
