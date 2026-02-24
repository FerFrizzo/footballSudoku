import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { DIVISIONS, type ClubProfile, type LevelProgress } from '../types';

interface GameState {
  isAuthenticated: boolean;
  supabaseUserId: string | null;
  deviceId: string;
  club: ClubProfile | null;
  levelProgress: Record<string, LevelProgress>;
  gems: number;
  autoCheck: boolean;
  soundEnabled: boolean;
  isPremium: boolean;
  freeHintsUsed: Record<string, boolean>;
  _hasHydrated: boolean;

  setAuthenticated: (v: boolean, userId?: string | null) => void;
  setClub: (club: ClubProfile) => void;
  completeLevel: (
    divisionId: string,
    levelIndex: number,
    stars: number,
    timeSec: number,
    gemsEarned: number
  ) => void;
  addGems: (amount: number) => void;
  spendGems: (amount: number) => boolean;
  markFreeHintUsed: (divisionId: string, levelIndex: number) => void;
  hasFreeHint: (divisionId: string, levelIndex: number) => boolean;
  setAutoCheck: (v: boolean) => void;
  setSoundEnabled: (v: boolean) => void;
  setPremium: (v: boolean) => void;
  resetProgress: () => void;
  getTotalStars: () => number;
  getDivisionStars: (divisionId: string) => number;
  isDivisionUnlocked: (divisionId: string) => boolean;
  isLevelUnlocked: (divisionId: string, levelIndex: number) => boolean;
  getLevelProgress: (divisionId: string, levelIndex: number) => LevelProgress | null;
  logout: () => void;
}

const initialProgress: Record<string, LevelProgress> = {};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      supabaseUserId: null,
      deviceId: Crypto.randomUUID(),
      club: null,
      levelProgress: initialProgress,
      gems: 0,
      autoCheck: false,
      soundEnabled: true,
      isPremium: false,
      freeHintsUsed: {},
      _hasHydrated: false,

      setAuthenticated: (v, userId) =>
        set({ isAuthenticated: v, supabaseUserId: userId || null }),

      setClub: (club) => set({ club }),

      completeLevel: (divisionId, levelIndex, stars, timeSec, gemsEarned) => {
        const key = `${divisionId}-${levelIndex}`;
        const current = get().levelProgress[key];
        const newProgress: LevelProgress = {
          starsBest: Math.max(stars, current?.starsBest || 0),
          bestTimeSec:
            current?.bestTimeSec != null
              ? Math.min(timeSec, current.bestTimeSec)
              : timeSec,
          completedAt: new Date().toISOString(),
        };
        set((s) => ({
          levelProgress: { ...s.levelProgress, [key]: newProgress },
          gems: s.gems + gemsEarned,
        }));
      },

      addGems: (amount) => set((s) => ({ gems: s.gems + amount })),

      spendGems: (amount) => {
        if (get().gems >= amount) {
          set((s) => ({ gems: s.gems - amount }));
          return true;
        }
        return false;
      },

      markFreeHintUsed: (divisionId, levelIndex) => {
        const key = `${divisionId}-${levelIndex}`;
        set((s) => ({
          freeHintsUsed: { ...s.freeHintsUsed, [key]: true },
        }));
      },

      hasFreeHint: (divisionId, levelIndex) => {
        const key = `${divisionId}-${levelIndex}`;
        return !get().freeHintsUsed[key];
      },

      setAutoCheck: (v) => set({ autoCheck: v }),
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setPremium: (v) => set({ isPremium: v }),

      resetProgress: () =>
        set({
          levelProgress: {},
          gems: 0,
          freeHintsUsed: {},
        }),

      getTotalStars: () => {
        return Object.values(get().levelProgress).reduce(
          (sum, lp) => sum + lp.starsBest,
          0
        );
      },

      getDivisionStars: (divisionId) => {
        const progress = get().levelProgress;
        let total = 0;
        const div = DIVISIONS.find((d) => d.id === divisionId);
        if (!div) return 0;
        for (let i = 0; i < div.levelCount; i++) {
          const key = `${divisionId}-${i}`;
          total += progress[key]?.starsBest || 0;
        }
        return total;
      },

      isDivisionUnlocked: (divisionId) => {
        const div = DIVISIONS.find((d) => d.id === divisionId);
        if (!div) return false;
        return get().getTotalStars() >= div.starsToUnlock;
      },

      isLevelUnlocked: (divisionId, levelIndex) => {
        if (!get().isDivisionUnlocked(divisionId)) return false;
        if (levelIndex === 0) return true;
        const prevKey = `${divisionId}-${levelIndex - 1}`;
        return !!get().levelProgress[prevKey]?.completedAt;
      },

      getLevelProgress: (divisionId, levelIndex) => {
        const key = `${divisionId}-${levelIndex}`;
        return get().levelProgress[key] || null;
      },

      logout: () =>
        set({
          isAuthenticated: false,
          supabaseUserId: null,
        }),
    }),
    {
      name: 'sudoku-game-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        supabaseUserId: state.supabaseUserId,
        deviceId: state.deviceId,
        club: state.club,
        levelProgress: state.levelProgress,
        gems: state.gems,
        autoCheck: state.autoCheck,
        soundEnabled: state.soundEnabled,
        isPremium: state.isPremium,
        freeHintsUsed: state.freeHintsUsed,
      }),
      onRehydrateStorage: () => {
        return () => {
          useGameStore.setState({ _hasHydrated: true });
        };
      },
    }
  )
);
