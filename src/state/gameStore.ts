import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { DIVISIONS, type ClubProfile, type MatchdayProgress, type DivisionLeague } from '../types';
import { generateLeagueTeams, simulateAIResults } from '../utils/clubGenerator';
import { changeLanguage, type LanguageCode } from '../i18n';

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface GameState {
  isAuthenticated: boolean;
  supabaseUserId: string | null;
  deviceId: string;
  club: ClubProfile | null;
  leagueProgress: Record<string, DivisionLeague>;
  gems: number;
  autoCheck: boolean;
  soundEnabled: boolean;
  isPremium: boolean;
  freeHintsUsed: Record<string, boolean>;
  language: string;
  _hasHydrated: boolean;

  setAuthenticated: (v: boolean, userId?: string | null) => void;
  setClub: (club: ClubProfile) => void;
  setLanguage: (code: string) => void;
  initDivision: (divisionId: string) => void;
  completeMatchday: (
    divisionId: string,
    matchdayIndex: number,
    stars: number,
    timeSec: number,
    gemsEarned: number
  ) => { result: 'win' | 'draw' | 'loss'; pointsEarned: number };
  addGems: (amount: number) => void;
  spendGems: (amount: number) => boolean;
  markFreeHintUsed: (divisionId: string, matchdayIndex: number) => void;
  hasFreeHint: (divisionId: string, matchdayIndex: number) => boolean;
  setAutoCheck: (v: boolean) => void;
  setSoundEnabled: (v: boolean) => void;
  setPremium: (v: boolean) => void;
  resetProgress: () => void;
  getTotalStars: () => number;
  getDivisionStars: (divisionId: string) => number;
  isDivisionUnlocked: (divisionId: string) => boolean;
  isMatchdayUnlocked: (divisionId: string, matchdayIndex: number) => boolean;
  getMatchdayProgress: (divisionId: string, matchdayIndex: number) => MatchdayProgress | null;
  getLeagueTable: (divisionId: string) => DivisionLeague['teams'];
  logout: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      supabaseUserId: null,
      deviceId: Crypto.randomUUID(),
      club: null,
      leagueProgress: {},
      gems: 0,
      autoCheck: false,
      soundEnabled: true,
      isPremium: false,
      freeHintsUsed: {},
      language: 'en',
      _hasHydrated: false,

      setAuthenticated: (v, userId) =>
        set({ isAuthenticated: v, supabaseUserId: userId || null }),

      setClub: (club) => set({ club }),

      setLanguage: (code) => {
        set({ language: code });
        changeLanguage(code);
      },

      initDivision: (divisionId) => {
        const state = get();
        if (state.leagueProgress[divisionId]) return;
        if (!state.club) return;

        const clubName = state.club.name;
        const seed = parseInt(divisionId) * 31337;
        const teams = generateLeagueTeams(divisionId, clubName, seed);
        const matchdays: MatchdayProgress[] = Array.from({ length: 20 }, () => ({
          starsBest: 0,
          bestTimeSec: null,
          completedAt: null,
        }));

        const div = DIVISIONS.find((d) => d.id === divisionId);
        const isGrassroots = divisionId === '10';
        const status = isGrassroots ? 'unlocked' : 'locked';

        const league: DivisionLeague = {
          teams,
          matchdays,
          currentMatchday: 0,
          userTeamId: 'user',
          divisionStatus: status,
        };

        set((s) => ({
          leagueProgress: { ...s.leagueProgress, [divisionId]: league },
        }));
      },

      completeMatchday: (divisionId, matchdayIndex, stars, timeSec, gemsEarned) => {
        const state = get();
        const league = state.leagueProgress[divisionId];
        if (!league) return { result: 'loss' as const, pointsEarned: 0 };

        const result: 'win' | 'draw' | 'loss' = stars === 3 ? 'win' : stars >= 1 ? 'draw' : 'loss';
        const pointsEarned = result === 'win' ? 3 : result === 'draw' ? 1 : 0;

        const newMatchdays = [...league.matchdays];
        const current = newMatchdays[matchdayIndex];
        newMatchdays[matchdayIndex] = {
          starsBest: Math.max(stars, current?.starsBest || 0),
          bestTimeSec: current?.bestTimeSec != null
            ? Math.min(timeSec, current.bestTimeSec)
            : timeSec,
          completedAt: new Date().toISOString(),
          result,
        };

        let newTeams = league.teams.map((t) => ({ ...t }));
        const userIdx = newTeams.findIndex((t) => t.isUser);
        if (userIdx >= 0) {
          newTeams[userIdx].played++;
          if (result === 'win') {
            newTeams[userIdx].wins++;
            newTeams[userIdx].points += 3;
            newTeams[userIdx].gf += Math.floor(Math.random() * 3) + 1;
            newTeams[userIdx].ga += Math.floor(Math.random() * 2);
          } else if (result === 'draw') {
            newTeams[userIdx].draws++;
            newTeams[userIdx].points += 1;
            const goals = Math.floor(Math.random() * 3);
            newTeams[userIdx].gf += goals;
            newTeams[userIdx].ga += goals;
          } else {
            newTeams[userIdx].losses++;
            newTeams[userIdx].gf += Math.floor(Math.random() * 2);
            newTeams[userIdx].ga += Math.floor(Math.random() * 3) + 1;
          }
        }

        const simSeed = parseInt(divisionId) * 10000 + matchdayIndex * 137 + 7;
        const rng = seededRandom(simSeed + Date.now() % 10000);
        newTeams = simulateAIResults(newTeams, rng);

        const newCurrentMatchday = matchdayIndex + 1;
        let newStatus = league.divisionStatus;

        if (newCurrentMatchday >= 20) {
          newStatus = 'completed';
          const sorted = [...newTeams].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            const gdA = a.gf - a.ga;
            const gdB = b.gf - b.ga;
            if (gdB !== gdA) return gdB - gdA;
            return b.gf - a.gf;
          });
          const userPosition = sorted.findIndex((t) => t.isUser) + 1;
          const divisionTier = parseInt(divisionId);

          if (userPosition <= 3 && divisionTier > 1) {
            const promoteToDivId = String(divisionTier - 1);
            const promotionLeague = state.leagueProgress[promoteToDivId];
            if (!promotionLeague || promotionLeague.divisionStatus === 'locked') {
              const clubName = state.club?.name || 'My Club';
              const promoSeed = (divisionTier - 1) * 31337;
              const promoTeams = generateLeagueTeams(promoteToDivId, clubName, promoSeed);
              const promoMatchdays: MatchdayProgress[] = Array.from({ length: 20 }, () => ({
                starsBest: 0,
                bestTimeSec: null,
                completedAt: null,
              }));

              set((s) => ({
                leagueProgress: {
                  ...s.leagueProgress,
                  [promoteToDivId]: {
                    teams: promoTeams,
                    matchdays: promoMatchdays,
                    currentMatchday: 0,
                    userTeamId: 'user',
                    divisionStatus: 'unlocked',
                  },
                },
              }));
            }
          }
        }

        set((s) => ({
          leagueProgress: {
            ...s.leagueProgress,
            [divisionId]: {
              ...league,
              teams: newTeams,
              matchdays: newMatchdays,
              currentMatchday: newCurrentMatchday,
              divisionStatus: newStatus,
            },
          },
          gems: s.gems + gemsEarned,
        }));

        return { result, pointsEarned };
      },

      addGems: (amount) => set((s) => ({ gems: s.gems + amount })),

      spendGems: (amount) => {
        if (get().gems >= amount) {
          set((s) => ({ gems: s.gems - amount }));
          return true;
        }
        return false;
      },

      markFreeHintUsed: (divisionId, matchdayIndex) => {
        const key = `${divisionId}-${matchdayIndex}`;
        set((s) => ({
          freeHintsUsed: { ...s.freeHintsUsed, [key]: true },
        }));
      },

      hasFreeHint: (divisionId, matchdayIndex) => {
        const key = `${divisionId}-${matchdayIndex}`;
        return !get().freeHintsUsed[key];
      },

      setAutoCheck: (v) => set({ autoCheck: v }),
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setPremium: (v) => set({ isPremium: v }),

      resetProgress: () =>
        set({
          leagueProgress: {},
          gems: 0,
          freeHintsUsed: {},
        }),

      getTotalStars: () => {
        const progress = get().leagueProgress;
        let total = 0;
        for (const divId of Object.keys(progress)) {
          const league = progress[divId];
          for (const md of league.matchdays) {
            total += md.starsBest;
          }
        }
        return total;
      },

      getDivisionStars: (divisionId) => {
        const league = get().leagueProgress[divisionId];
        if (!league) return 0;
        return league.matchdays.reduce((sum, md) => sum + md.starsBest, 0);
      },

      isDivisionUnlocked: (divisionId) => {
        if (divisionId === '10') return true;
        const league = get().leagueProgress[divisionId];
        return league?.divisionStatus === 'unlocked' || league?.divisionStatus === 'completed';
      },

      isMatchdayUnlocked: (divisionId, matchdayIndex) => {
        if (!get().isDivisionUnlocked(divisionId)) return false;
        const league = get().leagueProgress[divisionId];
        if (!league) return matchdayIndex === 0;
        if (matchdayIndex === 0) return true;
        return !!league.matchdays[matchdayIndex - 1]?.completedAt;
      },

      getMatchdayProgress: (divisionId, matchdayIndex) => {
        const league = get().leagueProgress[divisionId];
        if (!league) return null;
        return league.matchdays[matchdayIndex] || null;
      },

      getLeagueTable: (divisionId) => {
        const league = get().leagueProgress[divisionId];
        if (!league) return [];
        return [...league.teams].sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          const gdA = a.gf - a.ga;
          const gdB = b.gf - b.ga;
          if (gdB !== gdA) return gdB - gdA;
          return b.gf - a.gf;
        });
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
        leagueProgress: state.leagueProgress,
        gems: state.gems,
        autoCheck: state.autoCheck,
        soundEnabled: state.soundEnabled,
        isPremium: state.isPremium,
        freeHintsUsed: state.freeHintsUsed,
        language: state.language,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          useGameStore.setState({ _hasHydrated: true });
          if (state?.language) {
            changeLanguage(state.language);
          }
        };
      },
    }
  )
);
