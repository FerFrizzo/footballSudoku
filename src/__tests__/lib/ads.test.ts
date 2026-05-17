import { showInterstitialIfDue, initializeAds } from '../../lib/ads';

jest.mock('expo-constants', () => ({
  default: { executionEnvironment: 'bare' },
}));

jest.mock('../../state/gameStore', () => ({
  useGameStore: {
    getState: () => ({
      incrementGamesCompleted: () => true,
      resetAdCounter: jest.fn(),
    }),
  },
}));

jest.mock('../../services/analytics', () => ({
  trackEvent: jest.fn().mockResolvedValue(undefined),
}));

const mockUnsub = jest.fn();
const listeners: Record<string, Array<() => void>> = {};

const mockInterstitial = {
  load: jest.fn(),
  show: jest.fn().mockResolvedValue(undefined),
  addAdEventListener: jest.fn((event: string, cb: () => void) => {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(cb);
    return mockUnsub;
  }),
};

jest.mock('react-native-google-mobile-ads', () => ({
  mobileAds: () => ({ initialize: jest.fn().mockResolvedValue(undefined) }),
  InterstitialAd: { createForAdRequest: jest.fn(() => mockInterstitial) },
  AdEventType: { LOADED: 'loaded', ERROR: 'error', CLOSED: 'closed' },
  TestIds: { INTERSTITIAL: 'test-id' },
}));

function fireEvent(event: string) {
  (listeners[event] ?? []).forEach((cb) => cb());
}

beforeEach(() => {
  Object.keys(listeners).forEach((k) => delete listeners[k]);
  mockUnsub.mockClear();
  mockInterstitial.show.mockClear();
  mockInterstitial.addAdEventListener.mockClear();
  mockInterstitial.load.mockClear();
});

describe('showInterstitialIfDue — listener cleanup', () => {
  async function setup() {
    await initializeAds();
    fireEvent('loaded'); // marks adLoaded=true, also calls unsubLoaded() once
    // Clear out any remaining loadAd() listeners so they don't interfere with
    // the showInterstitialIfDue tests below.
    Object.keys(listeners).forEach((k) => delete listeners[k]);
    mockUnsub.mockClear(); // reset count — we only want to count cleanup() calls below
  }

  it('unsubscribes BOTH listeners when CLOSED fires', async () => {
    await setup();
    const p = showInterstitialIfDue('u1');
    fireEvent('closed');
    await p;
    expect(mockUnsub).toHaveBeenCalledTimes(2);
  });

  it('unsubscribes BOTH listeners when ERROR fires', async () => {
    await setup();
    const p = showInterstitialIfDue('u1');
    fireEvent('error');
    await p;
    expect(mockUnsub).toHaveBeenCalledTimes(2);
  });

  it('unsubscribes BOTH listeners when show() rejects', async () => {
    await setup();
    const { InterstitialAd } = require('react-native-google-mobile-ads');
    const createSpy = jest.spyOn(InterstitialAd, 'createForAdRequest');
    const createCountBefore = createSpy.mock.calls.length;
    mockInterstitial.show.mockRejectedValueOnce(new Error('show failed'));
    await showInterstitialIfDue('u1');
    expect(mockUnsub).toHaveBeenCalledTimes(2);
    expect(createSpy.mock.calls.length).toBe(createCountBefore + 1); // loadAd() was called
    createSpy.mockRestore();
  });
});
