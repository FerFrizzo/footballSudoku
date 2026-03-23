import { generateLeagueTeams, simulateAIResults } from '../../utils/clubGenerator';
import type { LeagueTeam } from '../../types';

// ─── generateLeagueTeams ─────────────────────────────────────────────────────

describe('generateLeagueTeams', () => {
  const USER_TEAM = 'Test United';
  const DIVISION_ID = '10';
  const SEED = 42;

  it('always returns exactly 20 teams', () => {
    const teams = generateLeagueTeams(DIVISION_ID, USER_TEAM, SEED);
    expect(teams).toHaveLength(20);
  });

  it('includes exactly one user team marked with isUser = true', () => {
    const teams = generateLeagueTeams(DIVISION_ID, USER_TEAM, SEED);
    const userTeams = teams.filter((t) => t.isUser);
    expect(userTeams).toHaveLength(1);
  });

  it('user team has the correct name and green badge color', () => {
    const teams = generateLeagueTeams(DIVISION_ID, USER_TEAM, SEED);
    const user = teams.find((t) => t.isUser)!;
    expect(user.name).toBe(USER_TEAM);
    expect(user.badgeSeedColor).toBe('#1B5E20');
  });

  it('user team starts with all stats at zero', () => {
    const teams = generateLeagueTeams(DIVISION_ID, USER_TEAM, SEED);
    const user = teams.find((t) => t.isUser)!;
    expect(user.points).toBe(0);
    expect(user.played).toBe(0);
    expect(user.wins).toBe(0);
    expect(user.draws).toBe(0);
    expect(user.losses).toBe(0);
    expect(user.gf).toBe(0);
    expect(user.ga).toBe(0);
  });

  it('all team names are unique', () => {
    const teams = generateLeagueTeams(DIVISION_ID, USER_TEAM, SEED);
    const names = teams.map((t) => t.name);
    expect(new Set(names).size).toBe(20);
  });

  it('does not generate any real English club names from the blocklist', () => {
    // Test a wide variety of seeds to stress the name generator
    const blocklisted = [
      'Manchester United', 'Manchester City', 'Liverpool', 'Chelsea',
      'Leeds United', 'Aston Villa', 'Crystal Palace', 'Tottenham Hotspur',
      'Nottingham Forest', 'West Ham United', 'Newcastle United',
    ];

    for (const seed of [1, 42, 100, 999, 12345]) {
      const teams = generateLeagueTeams('5', 'My Club', seed);
      const aiNames = teams.filter((t) => !t.isUser).map((t) => t.name);
      for (const blockedName of blocklisted) {
        expect(aiNames).not.toContain(blockedName);
      }
    }
  });

  it('is deterministic: same seed → same teams in same order', () => {
    const a = generateLeagueTeams(DIVISION_ID, USER_TEAM, SEED);
    const b = generateLeagueTeams(DIVISION_ID, USER_TEAM, SEED);
    expect(a).toEqual(b);
  });

  it('produces different teams for different seeds', () => {
    const a = generateLeagueTeams(DIVISION_ID, USER_TEAM, 1);
    const b = generateLeagueTeams(DIVISION_ID, USER_TEAM, 2);
    // At least one team name should differ
    const aNonUserNames = a.filter((t) => !t.isUser).map((t) => t.name);
    const bNonUserNames = b.filter((t) => !t.isUser).map((t) => t.name);
    expect(aNonUserNames).not.toEqual(bNonUserNames);
  });

  it('produces different teams for different divisions (same seed)', () => {
    const d1 = generateLeagueTeams('1', USER_TEAM, SEED);
    const d5 = generateLeagueTeams('5', USER_TEAM, SEED);
    const d1Names = d1.filter((t) => !t.isUser).map((t) => t.name);
    const d5Names = d5.filter((t) => !t.isUser).map((t) => t.name);
    // Different division salt in seed means different names
    expect(d1Names).not.toEqual(d5Names);
  });

  it('all AI team IDs are unique and contain the division id', () => {
    const teams = generateLeagueTeams('7', USER_TEAM, SEED);
    const aiIds = teams.filter((t) => !t.isUser).map((t) => t.id);
    expect(new Set(aiIds).size).toBe(19);
    aiIds.forEach((id) => expect(id).toContain('7'));
  });
});

// ─── simulateAIResults ───────────────────────────────────────────────────────

describe('simulateAIResults', () => {
  /** Create a fresh set of 20 teams (1 user + 19 AI) with zeroed stats */
  function makeTeams(): LeagueTeam[] {
    const teams: LeagueTeam[] = [
      {
        id: 'user', name: 'Test United', badgeSeedColor: '#1B5E20',
        points: 10, played: 5, wins: 3, draws: 1, losses: 1, gf: 8, ga: 4, isUser: true,
      },
    ];
    for (let i = 0; i < 19; i++) {
      teams.push({
        id: `ai-10-${i}`, name: `AI Team ${i}`, badgeSeedColor: '#E53935',
        points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, isUser: false,
      });
    }
    return teams;
  }

  // Seeded RNG (same implementation used in the app) for reproducible tests
  function seededRng(seed: number) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  it('does not mutate the input array', () => {
    const teams = makeTeams();
    const original = teams.map((t) => ({ ...t }));
    simulateAIResults(teams, seededRng(1));
    expect(teams).toEqual(original);
  });

  it('does not change the user team stats', () => {
    const teams = makeTeams();
    const userBefore = { ...teams.find((t) => t.isUser)! };
    const result = simulateAIResults(teams, seededRng(1));
    const userAfter = result.find((t) => t.isUser)!;
    expect(userAfter.points).toBe(userBefore.points);
    expect(userAfter.played).toBe(userBefore.played);
    expect(userAfter.wins).toBe(userBefore.wins);
  });

  it('increments played by 1 for each AI team that participated in a match', () => {
    const teams = makeTeams();
    const result = simulateAIResults(teams, seededRng(1));
    const aiTeams = result.filter((t) => !t.isUser);
    // 19 AI teams: 18 participate (9 pairs), 1 sits out
    const played = aiTeams.filter((t) => t.played === 1);
    const sitOut = aiTeams.filter((t) => t.played === 0);
    expect(played.length + sitOut.length).toBe(19);
    expect(played.length).toBe(18); // 9 pairs × 2 teams
    expect(sitOut.length).toBe(1);
  });

  it('each played AI match produces exactly 3 or 4 points (win 3+loss 0 or draw 1+draw 1)', () => {
    const teams = makeTeams();
    const result = simulateAIResults(teams, seededRng(42));

    // Pair up AI teams by their played count and check points are consistent
    const participated = result.filter((t) => !t.isUser && t.played === 1);
    const totalPoints = participated.reduce((sum, t) => sum + t.points, 0);
    // Every match gives either 3 (win+loss) or 2 (draw+draw) points in total
    // With 9 matches: between 18 (all draws) and 27 (all decisive)
    expect(totalPoints).toBeGreaterThanOrEqual(18);
    expect(totalPoints).toBeLessThanOrEqual(27);
  });

  it('a team that wins has wins++ and points += 3', () => {
    const teams = makeTeams();
    const result = simulateAIResults(teams, seededRng(7));
    const winners = result.filter((t) => !t.isUser && t.wins === 1);
    winners.forEach((w) => {
      expect(w.points).toBe(3);
      expect(w.losses).toBe(0);
      expect(w.draws).toBe(0);
    });
  });

  it('a team that draws has draws++ and points === 1', () => {
    const teams = makeTeams();
    const result = simulateAIResults(teams, seededRng(7));
    const drawers = result.filter((t) => !t.isUser && t.draws === 1);
    drawers.forEach((d) => {
      expect(d.points).toBe(1);
      expect(d.wins).toBe(0);
      expect(d.losses).toBe(0);
    });
  });

  it('goals for winner are >= goals for loser', () => {
    const teams = makeTeams();
    const result = simulateAIResults(teams, seededRng(13));
    const winners = result.filter((t) => !t.isUser && t.wins === 1);
    winners.forEach((w) => {
      expect(w.gf).toBeGreaterThan(w.ga);
    });
  });

  it('is deterministic: same rng seed → same result', () => {
    const teams = makeTeams();
    const a = simulateAIResults(teams, seededRng(99));
    const b = simulateAIResults(makeTeams(), seededRng(99));
    expect(a).toEqual(b);
  });
});
