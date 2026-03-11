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

// Location parts sourced from real English top-5-division club names
const LOCATION_PARTS: string[] = [
  // Premier League
  'Arsenal', 'Aston', 'Bournemouth', 'Brentford', 'Brighton', 'Chelsea',
  'Crystal', 'Everton', 'Fulham', 'Ipswich', 'Leicester', 'Liverpool',
  'Manchester', 'Newcastle', 'Nottingham', 'Southampton', 'Tottenham',
  'Wolverhampton', 'West Ham',
  // Championship
  'Burnley', 'Leeds', 'Sheffield', 'Middlesbrough', 'Sunderland', 'Norwich',
  'Stoke', 'Watford', 'Millwall', 'Coventry', 'Birmingham', 'Blackburn',
  'Preston', 'Bristol', 'Cardiff', 'Swansea', 'Derby', 'Hull', 'Plymouth',
  'Portsmouth', 'Luton', 'Charlton', 'Bolton', 'Blackpool', 'West Brom',
  // League One
  'Stockport', 'Wrexham', 'Doncaster', 'Wigan', 'Oxford', 'Cambridge',
  'Peterborough', 'Exeter', 'Shrewsbury', 'Barnsley', 'Rotherham', 'Reading',
  'Leyton', 'Burton', 'Cheltenham', 'Northampton', 'Colchester', 'Wycombe',
  'Carlisle', 'Fleetwood', 'Port', 'Stevenage',
  // League Two
  'Morecambe', 'Harrogate', 'Newport', 'Salford', 'Crawley', 'Swindon',
  'Bradford', 'Grimsby', 'Tranmere', 'Gillingham', 'Chesterfield', 'Walsall',
  'Sutton', 'Barrow', 'Accrington',
  // National League
  'Altrincham', 'Barnet', 'Boston', 'Bromley', 'Darlington', 'Halifax',
  'Gateshead', 'Hartlepool', 'Kidderminster', 'Maidstone', 'Maidenhead',
  'Oldham', 'Rochdale', 'Solihull', 'Southend', 'Spennymoor', 'Tamworth',
  'Torquay', 'Woking', 'Yeovil', 'York',
];

// Suffix parts sourced from real English club name endings
const SUFFIX_PARTS: string[] = [
  'United', 'City', 'Town', 'Rovers', 'Athletic', 'Wanderers',
  'Albion', 'County', 'Forest', 'Palace', 'Villa', 'Orient', 'Vale',
  'Rangers', 'Hotspur',
];

// Exact real team names to block — any generated combo matching one of these is rejected
const REAL_NAMES_BLOCKLIST = new Set<string>([
  // Premier League
  'Aston Villa', 'Brighton Albion', 'Crystal Palace', 'Ipswich Town',
  'Leicester City', 'Manchester City', 'Manchester United', 'Newcastle United',
  'Nottingham Forest', 'Tottenham Hotspur', 'West Ham United',
  'Wolverhampton Wanderers',
  // Championship
  'Leeds United', 'Sheffield United', 'Sheffield Wednesday', 'Norwich City',
  'Stoke City', 'Coventry City', 'Birmingham City', 'Blackburn Rovers',
  'Bristol City', 'Bristol Rovers', 'Cardiff City', 'Swansea City',
  'Derby County', 'Hull City', 'Luton Town', 'Charlton Athletic',
  'Bolton Wanderers', 'West Brom Albion',
  // League One
  'Stockport County', 'Doncaster Rovers', 'Wigan Athletic', 'Oxford United',
  'Cambridge United', 'Peterborough United', 'Exeter City', 'Shrewsbury Town',
  'Rotherham United', 'Leyton Orient', 'Burton Albion', 'Cheltenham Town',
  'Northampton Town', 'Colchester United', 'Wycombe Wanderers', 'Carlisle United',
  'Fleetwood Town', 'Port Vale',
  // League Two
  'Harrogate Town', 'Newport County', 'Salford City', 'Crawley Town',
  'Swindon Town', 'Bradford City', 'Grimsby Town', 'Tranmere Rovers',
  'Sutton United',
  // National League
  'Boston United', 'Hartlepool United', 'Maidstone United', 'Maidenhead United',
  'Oldham Athletic', 'Southend United', 'Spennymoor Town', 'Torquay United',
  'York City', 'Yeovil Town',
]);

const BADGE_COLORS = [
  '#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#3949AB',
  '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047',
  '#7CB342', '#C0CA33', '#FDD835', '#FFB300', '#FB8C00',
  '#F4511E', '#6D4C41', '#546E7A', '#1565C0', '#AD1457',
];

function generateClubName(rng: () => number, usedNames: Set<string>): string {
  const maxAttempts = 500;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const location = LOCATION_PARTS[Math.floor(rng() * LOCATION_PARTS.length)];
    const suffix = SUFFIX_PARTS[Math.floor(rng() * SUFFIX_PARTS.length)];
    const name = `${location} ${suffix}`;

    if (!REAL_NAMES_BLOCKLIST.has(name) && !usedNames.has(name)) {
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
