import type { LeagueTeam } from '../types';

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function shuffleWithRng<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const FICTIONAL_PREFIXES = [
  'Vorn', 'Keld', 'Tren', 'Axen', 'Brant', 'Drav', 'Elgar', 'Faldr', 'Grald', 'Halven',
  'Invar', 'Karns', 'Lorim', 'Malven', 'Norven', 'Preld', 'Ravind', 'Streld', 'Thorval', 'Ulven',
  'Valdri', 'Wrenth', 'Yovar', 'Zelvar', 'Aldren', 'Brimor', 'Caldris', 'Dorvath', 'Edvar', 'Fennor',
  'Gorvel', 'Helstr', 'Ivorn', 'Jeldran', 'Kolvast', 'Lindvar', 'Morven', 'Naldr', 'Oxvarn', 'Pelgr',
];

const PLACE_ROOTS = [
  'bridge', 'vale', 'haven', 'moor', 'dale', 'shaw', 'holt', 'croft',
  'cliff', 'holm', 'beck', 'ridge', 'grove', 'mere', 'combe', 'stead',
  'worth', 'field', 'ford', 'gate', 'wood', 'marsh', 'heath',
];

const NOUN_FIRST = [
  'Iron', 'Ash', 'Crown', 'Anchor', 'Forge', 'Crest', 'Tower', 'Cinder',
  'Granite', 'Ember', 'Thorn', 'Frost', 'Amber', 'Cobalt', 'Flint', 'Heron',
  'Hawk', 'Raven', 'Falcon', 'Drake', 'Lark', 'Crane', 'Swift',
  'Copper', 'Bronze', 'Scarlet', 'Crimson', 'Blaze', 'Gale', 'Crag',
];

const NOUN_SECOND = [
  'wick', 'holt', 'worth', 'shaw', 'holm', 'wood', 'dale',
  'bridge', 'croft', 'well', 'marsh', 'vale', 'moor', 'ford',
  'gate', 'field', 'stead', 'beck', 'combe', 'ridge',
];

const SUFFIXES = [
  'FC', 'United', 'Town', 'Rovers', 'Athletic', 'Borough',
  'Rangers', 'Wanderers', 'Albion', 'Orient',
  'Dynamo', 'Sporting', 'Crusaders', 'Nomads',
];

const BADGE_COLORS = [
  '#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#3949AB',
  '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047',
  '#7CB342', '#C0CA33', '#FDD835', '#FFB300', '#FB8C00',
  '#F4511E', '#6D4C41', '#546E7A', '#1565C0', '#AD1457',
];

function generateClubName(rng: () => number, usedNames: Set<string>): string {
  const maxAttempts = 300;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let placeName: string;

    const style = Math.floor(rng() * 3);
    if (style === 0) {
      const prefix = FICTIONAL_PREFIXES[Math.floor(rng() * FICTIONAL_PREFIXES.length)];
      const root = PLACE_ROOTS[Math.floor(rng() * PLACE_ROOTS.length)];
      placeName = prefix + root;
    } else if (style === 1) {
      const noun = NOUN_FIRST[Math.floor(rng() * NOUN_FIRST.length)];
      const suffix = NOUN_SECOND[Math.floor(rng() * NOUN_SECOND.length)];
      placeName = noun + suffix;
    } else {
      const prefix = FICTIONAL_PREFIXES[Math.floor(rng() * FICTIONAL_PREFIXES.length)];
      const noun = NOUN_FIRST[Math.floor(rng() * NOUN_FIRST.length)];
      const suffix = NOUN_SECOND[Math.floor(rng() * NOUN_SECOND.length)];
      placeName = prefix + ' ' + noun + suffix;
    }

    const descriptor = SUFFIXES[Math.floor(rng() * SUFFIXES.length)];
    const name = `${placeName} ${descriptor}`;

    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
  }

  const fallback = `Club ${Math.floor(rng() * 9000 + 1000)}`;
  usedNames.add(fallback);
  return fallback;
}

export function generateLeagueTeams(
  divisionId: string,
  userTeamName: string,
  seed: number
): LeagueTeam[] {
  const rng = seededRandom(seed + parseInt(divisionId) * 7919);
  const usedNames = new Set<string>();
  usedNames.add(userTeamName);

  const teams: LeagueTeam[] = [];

  teams.push({
    id: 'user',
    name: userTeamName,
    badgeSeedColor: '#1B5E20',
    points: 0,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    gf: 0,
    ga: 0,
    isUser: true,
  });

  for (let i = 0; i < 19; i++) {
    const name = generateClubName(rng, usedNames);
    const color = BADGE_COLORS[Math.floor(rng() * BADGE_COLORS.length)];

    teams.push({
      id: `ai-${divisionId}-${i}`,
      name,
      badgeSeedColor: color,
      points: 0,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gf: 0,
      ga: 0,
      isUser: false,
    });
  }

  return shuffleWithRng(teams, rng);
}

export function simulateAIResults(
  teams: LeagueTeam[],
  rng: () => number
): LeagueTeam[] {
  const updated = teams.map((t) => ({ ...t }));
  const aiTeams = updated.filter((t) => !t.isUser);

  const shuffled = shuffleWithRng(aiTeams, rng);

  for (let i = 0; i < shuffled.length - 1; i += 2) {
    const teamA = shuffled[i];
    const teamB = shuffled[i + 1];

    const rankA = updated.indexOf(updated.find((t) => t.id === teamA.id)!);
    const rankB = updated.indexOf(updated.find((t) => t.id === teamB.id)!);
    const strengthA = 0.5 + (20 - rankA) * 0.02;
    const strengthB = 0.5 + (20 - rankB) * 0.02;

    const roll = rng();
    const totalStrength = strengthA + strengthB;
    const winAThreshold = (strengthA / totalStrength) * 0.45;
    const drawThreshold = winAThreshold + 0.25;

    const goalsA = Math.floor(rng() * 4);
    const goalsB = Math.floor(rng() * 4);

    const aIdx = updated.findIndex((t) => t.id === teamA.id);
    const bIdx = updated.findIndex((t) => t.id === teamB.id);

    updated[aIdx].played++;
    updated[bIdx].played++;

    if (roll < winAThreshold) {
      updated[aIdx].wins++;
      updated[aIdx].points += 3;
      updated[aIdx].gf += Math.max(goalsA, goalsB + 1);
      updated[aIdx].ga += Math.min(goalsA, goalsB);
      updated[bIdx].losses++;
      updated[bIdx].gf += Math.min(goalsA, goalsB);
      updated[bIdx].ga += Math.max(goalsA, goalsB + 1);
    } else if (roll < drawThreshold) {
      updated[aIdx].draws++;
      updated[aIdx].points += 1;
      updated[aIdx].gf += goalsA;
      updated[aIdx].ga += goalsA;
      updated[bIdx].draws++;
      updated[bIdx].points += 1;
      updated[bIdx].gf += goalsA;
      updated[bIdx].ga += goalsA;
    } else {
      updated[bIdx].wins++;
      updated[bIdx].points += 3;
      updated[bIdx].gf += Math.max(goalsA, goalsB + 1);
      updated[bIdx].ga += Math.min(goalsA, goalsB);
      updated[aIdx].losses++;
      updated[aIdx].gf += Math.min(goalsA, goalsB);
      updated[aIdx].ga += Math.max(goalsA, goalsB + 1);
    }
  }

  return updated;
}
