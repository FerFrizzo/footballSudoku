/**
 * Tests for the Zustand game store.
 *
 * External dependencies that would require native modules or network access
 * are mocked so these tests run purely in-process.
 */

// ─── Module mocks (hoisted before imports) ───────────────────────────────────

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(() => 'test-device-uuid') }));
jest.mock('../../i18n', () => ({ changeLanguage: jest.fn() }));
jest.mock('../../utils/clubGenerator', () => ({
  generateLeagueTeams: jest.fn(),
  simulateAIResults: jest.fn((teams: any[]) => teams), // pass-through
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import { useGameStore } from '../../state/gameStore';
import { generateLeagueTeams } from '../../utils/clubGenerator';
import type { LeagueTeam, MatchdayProgress, ClubProfile } from '../../types';

const mockGenerateLeagueTeams = generateLeagueTeams as jest.Mock;

// ─── Fixtures ────────────────────────────────────────────────────────────────

const TEST_CLUB: ClubProfile = {
  name: 'Test United',
  badgeUri: null,
  primaryColor: '#1B5E20',
  secondaryColor: '#FFD600',
};

/** Build a league-ready team list: 1 user + 19 AI teams */
function makeMockTeams(divisionId: string): LeagueTeam[] {
  return [
    {
      id: 'user', name: TEST_CLUB.name, badgeSeedColor: '#1B5E20',
      points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, isUser: true,
    },
    ...Array.from({ length: 19 }, (_, i): LeagueTeam => ({
      id: `ai-${divisionId}-${i}`, name: `AI Team ${i + 1}`, badgeSeedColor: '#E53935',
      points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, isUser: false,
    })),
  ];
}

/** Build a DivisionLeague with the first N matchdays already completed */
function makeLeague(divisionId: string, completedCount: number, userPoints = 0) {
  const teams = makeMockTeams(divisionId);
  const userIdx = teams.findIndex((t) => t.isUser);
  teams[userIdx].points = userPoints;
  teams[userIdx].wins = Math.floor(userPoints / 3);
  teams[userIdx].played = completedCount;

  const matchdays: MatchdayProgress[] = Array.from({ length: 20 }, (_, i) => ({
    starsBest: i < completedCount ? 3 : 0,
    bestTimeSec: i < completedCount ? 120 : null,
    completedAt: i < completedCount ? '2026-01-01T00:00:00.000Z' : null,
  }));

  return {
    teams,
    matchdays,
    currentMatchday: completedCount,
    userTeamId: 'user',
    divisionStatus: (divisionId === '10' ? 'unlocked' : 'locked') as 'unlocked' | 'locked',
  };
}

// ─── Store reset ──────────────────────────────────────────────────────────────

beforeEach(() => {
  useGameStore.setState({
    isAuthenticated: false,
    supabaseUserId: null,
    deviceId: 'test-device-uuid',
    club: null,
    leagueProgress: {},
    gems: 0,
    autoCheck: false,
    soundEnabled: true,
    isPremium: false,
    freeHintsUsed: {},
    language: 'en',
    _hasHydrated: true,
  });

  // Default mock: return 20 teams for any division
  mockGenerateLeagueTeams.mockImplementation((divId: string) => makeMockTeams(divId));
});

// ─── initDivision ─────────────────────────────────────────────────────────────

describe('initDivision', () => {
  it('does nothing if the club is not set', () => {
    useGameStore.getState().initDivision('10');
    expect(useGameStore.getState().leagueProgress['10']).toBeUndefined();
  });

  it('does nothing if the division is already initialised (idempotent)', () => {
    useGameStore.setState({ club: TEST_CLUB });
    useGameStore.getState().initDivision('10');
    const firstTeams = useGameStore.getState().leagueProgress['10'].teams;
    mockGenerateLeagueTeams.mockReturnValueOnce([]); // would produce different result
    useGameStore.getState().initDivision('10');
    expect(useGameStore.getState().leagueProgress['10'].teams).toBe(firstTeams);
  });

  it('creates a division with exactly 20 matchdays', () => {
    useGameStore.setState({ club: TEST_CLUB });
    useGameStore.getState().initDivision('10');
    expect(useGameStore.getState().leagueProgress['10'].matchdays).toHaveLength(20);
  });

  it('initialises division 10 (Grassroots) as "unlocked"', () => {
    useGameStore.setState({ club: TEST_CLUB });
    useGameStore.getState().initDivision('10');
    expect(useGameStore.getState().leagueProgress['10'].divisionStatus).toBe('unlocked');
  });

  it('initialises any other division as "locked"', () => {
    useGameStore.setState({ club: TEST_CLUB });
    useGameStore.getState().initDivision('5');
    expect(useGameStore.getState().leagueProgress['5'].divisionStatus).toBe('locked');
  });

  it('all matchdays start with starsBest = 0 and no completedAt', () => {
    useGameStore.setState({ club: TEST_CLUB });
    useGameStore.getState().initDivision('10');
    const mds = useGameStore.getState().leagueProgress['10'].matchdays;
    mds.forEach((md) => {
      expect(md.starsBest).toBe(0);
      expect(md.completedAt).toBeNull();
    });
  });
});

// ─── completeMatchday — result classification ─────────────────────────────────

describe('completeMatchday — result', () => {
  beforeEach(() => {
    useGameStore.setState({
      club: TEST_CLUB,
      leagueProgress: { '10': makeLeague('10', 0) },
    });
  });

  it('returns win and 3 points for 3 stars', () => {
    const { result, pointsEarned } = useGameStore.getState().completeMatchday('10', 0, 3, 120, 15);
    expect(result).toBe('win');
    expect(pointsEarned).toBe(3);
  });

  it('returns draw and 1 point for 2 stars', () => {
    const { result, pointsEarned } = useGameStore.getState().completeMatchday('10', 0, 2, 120, 10);
    expect(result).toBe('draw');
    expect(pointsEarned).toBe(1);
  });

  it('returns draw and 1 point for 1 star', () => {
    const { result, pointsEarned } = useGameStore.getState().completeMatchday('10', 0, 1, 120, 5);
    expect(result).toBe('draw');
    expect(pointsEarned).toBe(1);
  });

  it('returns loss and 0 points for 0 stars', () => {
    const { result, pointsEarned } = useGameStore.getState().completeMatchday('10', 0, 0, 120, 0);
    expect(result).toBe('loss');
    expect(pointsEarned).toBe(0);
  });

  it('returns loss and 0 when division does not exist in progress', () => {
    const { result, pointsEarned } = useGameStore.getState().completeMatchday('99', 0, 3, 60, 15);
    expect(result).toBe('loss');
    expect(pointsEarned).toBe(0);
  });
});

// ─── completeMatchday — matchday record updates ───────────────────────────────

describe('completeMatchday — matchday record', () => {
  beforeEach(() => {
    useGameStore.setState({
      club: TEST_CLUB,
      leagueProgress: { '10': makeLeague('10', 0) },
    });
  });

  it('records the best stars for a newly completed matchday', () => {
    useGameStore.getState().completeMatchday('10', 0, 2, 90, 10);
    expect(useGameStore.getState().leagueProgress['10'].matchdays[0].starsBest).toBe(2);
  });

  it('keeps the higher stars on a repeat completion', () => {
    useGameStore.getState().completeMatchday('10', 0, 2, 90, 10);
    useGameStore.getState().completeMatchday('10', 0, 1, 60, 5);  // worse run
    expect(useGameStore.getState().leagueProgress['10'].matchdays[0].starsBest).toBe(2);
  });

  it('upgrades stars when a repeat completion is better', () => {
    useGameStore.getState().completeMatchday('10', 0, 1, 200, 5);
    useGameStore.getState().completeMatchday('10', 0, 3, 50, 15); // better run
    expect(useGameStore.getState().leagueProgress['10'].matchdays[0].starsBest).toBe(3);
  });

  it('records the best (lowest) time on repeated completions', () => {
    useGameStore.getState().completeMatchday('10', 0, 2, 300, 10);
    useGameStore.getState().completeMatchday('10', 0, 2, 100, 10); // faster
    expect(useGameStore.getState().leagueProgress['10'].matchdays[0].bestTimeSec).toBe(100);
  });

  it('sets completedAt to a valid ISO date string', () => {
    useGameStore.getState().completeMatchday('10', 0, 3, 60, 15);
    const completedAt = useGameStore.getState().leagueProgress['10'].matchdays[0].completedAt;
    expect(completedAt).not.toBeNull();
    expect(new Date(completedAt!).toISOString()).toBe(completedAt);
  });

  it('advances currentMatchday by 1', () => {
    useGameStore.getState().completeMatchday('10', 0, 3, 60, 15);
    expect(useGameStore.getState().leagueProgress['10'].currentMatchday).toBe(1);
  });
});

// ─── completeMatchday — gems ──────────────────────────────────────────────────

describe('completeMatchday — gems', () => {
  beforeEach(() => {
    useGameStore.setState({
      club: TEST_CLUB,
      leagueProgress: { '10': makeLeague('10', 0) },
      gems: 0,
    });
  });

  it('adds the earned gems to the wallet', () => {
    useGameStore.getState().completeMatchday('10', 0, 3, 60, 15);
    expect(useGameStore.getState().gems).toBe(15);
  });

  it('accumulates gems across multiple completions', () => {
    useGameStore.getState().completeMatchday('10', 0, 3, 60, 15);
    useGameStore.setState({ leagueProgress: { '10': makeLeague('10', 1) } });
    useGameStore.getState().completeMatchday('10', 1, 2, 90, 10);
    expect(useGameStore.getState().gems).toBe(25);
  });
});

// ─── completeMatchday — promotion ────────────────────────────────────────────

describe('completeMatchday — promotion', () => {
  it('unlocks the next division when user finishes in top-3 after matchday 19', () => {
    // Set up division 10 with 19 matchdays done; user has 100 points → #1
    const league = makeLeague('10', 19, 100);
    league.divisionStatus = 'unlocked';
    useGameStore.setState({ club: TEST_CLUB, leagueProgress: { '10': league } });

    useGameStore.getState().completeMatchday('10', 19, 3, 60, 15);

    const div9 = useGameStore.getState().leagueProgress['9'];
    expect(div9).toBeDefined();
    expect(div9.divisionStatus).toBe('unlocked');
  });

  it('does NOT unlock a higher division when user finishes outside top-3', () => {
    // Give all AI teams 200 points → user (0 pts) will be last
    const league = makeLeague('10', 19, 0);
    league.teams = league.teams.map((t) =>
      t.isUser ? t : { ...t, points: 200, wins: 66, played: 19 }
    );
    league.divisionStatus = 'unlocked';
    useGameStore.setState({ club: TEST_CLUB, leagueProgress: { '10': league } });

    useGameStore.getState().completeMatchday('10', 19, 3, 60, 15);

    expect(useGameStore.getState().leagueProgress['9']).toBeUndefined();
  });

  it('marks division as "completed" after the 20th matchday', () => {
    const league = makeLeague('10', 19);
    league.divisionStatus = 'unlocked';
    useGameStore.setState({ club: TEST_CLUB, leagueProgress: { '10': league } });

    useGameStore.getState().completeMatchday('10', 19, 3, 60, 15);

    expect(useGameStore.getState().leagueProgress['10'].divisionStatus).toBe('completed');
  });

  it('does not re-initialise a promoted division that is already unlocked', () => {
    const league10 = makeLeague('10', 19, 100);
    league10.divisionStatus = 'unlocked';
    const league9 = makeLeague('9', 5);
    league9.divisionStatus = 'unlocked'; // already unlocked

    useGameStore.setState({
      club: TEST_CLUB,
      leagueProgress: { '10': league10, '9': league9 },
    });

    useGameStore.getState().completeMatchday('10', 19, 3, 60, 15);

    // Division 9 should NOT have been re-initialised (preserves existing progress)
    expect(useGameStore.getState().leagueProgress['9'].currentMatchday).toBe(5);
  });

  it('does not attempt to promote from division 1 (already at top)', () => {
    const league = makeLeague('1', 19, 100);
    league.divisionStatus = 'unlocked';
    useGameStore.setState({ club: TEST_CLUB, leagueProgress: { '1': league } });

    // Should not throw and should not create a division "0"
    expect(() =>
      useGameStore.getState().completeMatchday('1', 19, 3, 60, 15)
    ).not.toThrow();
    expect(useGameStore.getState().leagueProgress['0']).toBeUndefined();
  });
});

// ─── addGems / spendGems ──────────────────────────────────────────────────────

describe('addGems / spendGems', () => {
  it('addGems increases the balance', () => {
    useGameStore.getState().addGems(50);
    expect(useGameStore.getState().gems).toBe(50);
  });

  it('addGems accumulates correctly', () => {
    useGameStore.getState().addGems(20);
    useGameStore.getState().addGems(30);
    expect(useGameStore.getState().gems).toBe(50);
  });

  it('spendGems deducts from balance and returns true when sufficient funds', () => {
    useGameStore.setState({ gems: 100 });
    const ok = useGameStore.getState().spendGems(50);
    expect(ok).toBe(true);
    expect(useGameStore.getState().gems).toBe(50);
  });

  it('spendGems returns false and does NOT change balance when insufficient', () => {
    useGameStore.setState({ gems: 30 });
    const ok = useGameStore.getState().spendGems(50);
    expect(ok).toBe(false);
    expect(useGameStore.getState().gems).toBe(30);
  });

  it('spendGems allows spending the exact balance', () => {
    useGameStore.setState({ gems: 50 });
    expect(useGameStore.getState().spendGems(50)).toBe(true);
    expect(useGameStore.getState().gems).toBe(0);
  });
});

// ─── markFreeHintUsed / hasFreeHint ──────────────────────────────────────────

describe('markFreeHintUsed / hasFreeHint', () => {
  it('hasFreeHint returns true before any hint is used', () => {
    expect(useGameStore.getState().hasFreeHint('10', 0)).toBe(true);
  });

  it('hasFreeHint returns false after markFreeHintUsed', () => {
    useGameStore.getState().markFreeHintUsed('10', 0);
    expect(useGameStore.getState().hasFreeHint('10', 0)).toBe(false);
  });

  it('marking a hint for one matchday does not affect another matchday', () => {
    useGameStore.getState().markFreeHintUsed('10', 0);
    expect(useGameStore.getState().hasFreeHint('10', 1)).toBe(true);
  });

  it('marking a hint for one division does not affect another division', () => {
    useGameStore.getState().markFreeHintUsed('10', 0);
    expect(useGameStore.getState().hasFreeHint('9', 0)).toBe(true);
  });
});

// ─── isDivisionUnlocked ───────────────────────────────────────────────────────

describe('isDivisionUnlocked', () => {
  it('division 10 is always unlocked, even without leagueProgress', () => {
    expect(useGameStore.getState().isDivisionUnlocked('10')).toBe(true);
  });

  it('a locked division returns false', () => {
    useGameStore.setState({ leagueProgress: { '5': makeLeague('5', 0) } });
    expect(useGameStore.getState().isDivisionUnlocked('5')).toBe(false);
  });

  it('an unlocked division returns true', () => {
    const league = makeLeague('5', 0);
    league.divisionStatus = 'unlocked';
    useGameStore.setState({ leagueProgress: { '5': league } });
    expect(useGameStore.getState().isDivisionUnlocked('5')).toBe(true);
  });

  it('a completed division returns true', () => {
    const league = makeLeague('5', 20);
    league.divisionStatus = 'completed';
    useGameStore.setState({ leagueProgress: { '5': league } });
    expect(useGameStore.getState().isDivisionUnlocked('5')).toBe(true);
  });

  it('a division not in leagueProgress (other than 10) returns false', () => {
    expect(useGameStore.getState().isDivisionUnlocked('1')).toBe(false);
  });
});

// ─── isMatchdayUnlocked ───────────────────────────────────────────────────────

describe('isMatchdayUnlocked', () => {
  it('matchday 0 is always unlocked when the division is unlocked', () => {
    useGameStore.setState({ leagueProgress: { '10': makeLeague('10', 0) } });
    expect(useGameStore.getState().isMatchdayUnlocked('10', 0)).toBe(true);
  });

  it('matchday 1 is locked until matchday 0 is completed', () => {
    useGameStore.setState({ leagueProgress: { '10': makeLeague('10', 0) } });
    expect(useGameStore.getState().isMatchdayUnlocked('10', 1)).toBe(false);
  });

  it('matchday 1 is unlocked after matchday 0 is completed', () => {
    useGameStore.setState({ leagueProgress: { '10': makeLeague('10', 1) } });
    expect(useGameStore.getState().isMatchdayUnlocked('10', 1)).toBe(true);
  });

  it('returns false for any matchday in a locked division', () => {
    useGameStore.setState({ leagueProgress: { '5': makeLeague('5', 10) } });
    expect(useGameStore.getState().isMatchdayUnlocked('5', 0)).toBe(false);
  });
});

// ─── getTotalStars / getDivisionStars ─────────────────────────────────────────

describe('getTotalStars / getDivisionStars', () => {
  it('getTotalStars returns 0 with no progress', () => {
    expect(useGameStore.getState().getTotalStars()).toBe(0);
  });

  it('getDivisionStars returns 0 for an uninitialised division', () => {
    expect(useGameStore.getState().getDivisionStars('10')).toBe(0);
  });

  it('getDivisionStars sums starsBest for all matchdays', () => {
    useGameStore.setState({ leagueProgress: { '10': makeLeague('10', 5) } });
    // makeLeague gives 3 stars for each of the first 5 matchdays
    expect(useGameStore.getState().getDivisionStars('10')).toBe(15);
  });

  it('getTotalStars sums across multiple divisions', () => {
    useGameStore.setState({
      leagueProgress: {
        '10': makeLeague('10', 3), // 9 stars
        '9': makeLeague('9', 2),   // 6 stars
      },
    });
    expect(useGameStore.getState().getTotalStars()).toBe(15);
  });
});

// ─── getLeagueTable ───────────────────────────────────────────────────────────

describe('getLeagueTable', () => {
  it('returns an empty array for an uninitialised division', () => {
    expect(useGameStore.getState().getLeagueTable('10')).toEqual([]);
  });

  it('sorts teams by points descending', () => {
    const league = makeLeague('10', 0);
    league.teams[1].points = 9;  // AI Team 1 leads
    league.teams[2].points = 6;  // AI Team 2 second
    useGameStore.setState({ leagueProgress: { '10': league } });

    const table = useGameStore.getState().getLeagueTable('10');
    expect(table[0].points).toBeGreaterThanOrEqual(table[1].points);
    expect(table[1].points).toBeGreaterThanOrEqual(table[2].points);
  });

  it('breaks ties by goal difference (gf - ga) descending', () => {
    const league = makeLeague('10', 0);
    league.teams[1].points = 3; league.teams[1].gf = 5; league.teams[1].ga = 1; // gd +4
    league.teams[2].points = 3; league.teams[2].gf = 3; league.teams[2].ga = 1; // gd +2
    useGameStore.setState({ leagueProgress: { '10': league } });

    const table = useGameStore.getState().getLeagueTable('10');
    const tied = table.filter((t) => t.points === 3);
    expect(tied[0].gf - tied[0].ga).toBeGreaterThan(tied[1].gf - tied[1].ga);
  });

  it('breaks ties further by goals-for descending', () => {
    const league = makeLeague('10', 0);
    league.teams[1].points = 3; league.teams[1].gf = 3; league.teams[1].ga = 1; // gd+2, gf=3
    league.teams[2].points = 3; league.teams[2].gf = 5; league.teams[2].ga = 3; // gd+2, gf=5
    useGameStore.setState({ leagueProgress: { '10': league } });

    const table = useGameStore.getState().getLeagueTable('10');
    const tied = table.filter((t) => t.points === 3);
    expect(tied[0].gf).toBeGreaterThan(tied[1].gf);
  });

  it('does not mutate the stored teams array', () => {
    const league = makeLeague('10', 0);
    league.teams[0].points = 9; // user leads
    useGameStore.setState({ leagueProgress: { '10': league } });

    const originalOrder = [...useGameStore.getState().leagueProgress['10'].teams];
    useGameStore.getState().getLeagueTable('10');
    expect(useGameStore.getState().leagueProgress['10'].teams).toEqual(originalOrder);
  });
});

// ─── resetProgress ────────────────────────────────────────────────────────────

describe('resetProgress', () => {
  it('clears leagueProgress', () => {
    useGameStore.setState({ leagueProgress: { '10': makeLeague('10', 5) } });
    useGameStore.getState().resetProgress();
    expect(useGameStore.getState().leagueProgress).toEqual({});
  });

  it('resets gems to 0', () => {
    useGameStore.setState({ gems: 500 });
    useGameStore.getState().resetProgress();
    expect(useGameStore.getState().gems).toBe(0);
  });

  it('clears freeHintsUsed', () => {
    useGameStore.getState().markFreeHintUsed('10', 0);
    useGameStore.getState().resetProgress();
    expect(useGameStore.getState().hasFreeHint('10', 0)).toBe(true);
  });

  it('preserves club, auth, and settings', () => {
    useGameStore.setState({
      club: TEST_CLUB,
      isAuthenticated: true,
      autoCheck: true,
      soundEnabled: false,
      isPremium: true,
    });
    useGameStore.getState().resetProgress();
    const s = useGameStore.getState();
    expect(s.club).toEqual(TEST_CLUB);
    expect(s.isAuthenticated).toBe(true);
    expect(s.autoCheck).toBe(true);
    expect(s.soundEnabled).toBe(false);
    expect(s.isPremium).toBe(true);
  });
});

// ─── settings ────────────────────────────────────────────────────────────────

describe('settings', () => {
  it('setAutoCheck toggles the flag', () => {
    useGameStore.getState().setAutoCheck(true);
    expect(useGameStore.getState().autoCheck).toBe(true);
    useGameStore.getState().setAutoCheck(false);
    expect(useGameStore.getState().autoCheck).toBe(false);
  });

  it('setSoundEnabled toggles the flag', () => {
    useGameStore.getState().setSoundEnabled(false);
    expect(useGameStore.getState().soundEnabled).toBe(false);
  });

  it('setPremium toggles the flag', () => {
    useGameStore.getState().setPremium(true);
    expect(useGameStore.getState().isPremium).toBe(true);
  });

  it('setLanguage updates the language and calls changeLanguage', () => {
    const { changeLanguage } = require('../../i18n');
    useGameStore.getState().setLanguage('de');
    expect(useGameStore.getState().language).toBe('de');
    expect(changeLanguage).toHaveBeenCalledWith('de');
  });

  it('logout clears auth state but preserves other data', () => {
    useGameStore.setState({ isAuthenticated: true, supabaseUserId: 'user-123', gems: 50 });
    useGameStore.getState().logout();
    expect(useGameStore.getState().isAuthenticated).toBe(false);
    expect(useGameStore.getState().supabaseUserId).toBeNull();
    expect(useGameStore.getState().gems).toBe(50); // preserved
  });
});
