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

// Place-name parts extracted from English football clubs
// across the top 5 tiers (Premier League → National League)
const PLACE_PARTS = [
  // Premier League
  'Arsenal', 'Aston', 'Bournemouth', 'Brentford', 'Brighton',
  'Chelsea', 'Everton', 'Fulham', 'Ipswich', 'Leicester',
  'Liverpool', 'Manchester', 'Newcastle', 'Nottingham', 'Southampton',
  'Tottenham', 'Wolverhampton', 'Crystal', 'West Ham',
  // Championship
  'Blackburn', 'Bristol', 'Burnley', 'Cardiff', 'Coventry',
  'Derby', 'Hull', 'Leeds', 'Luton', 'Middlesbrough',
  'Millwall', 'Norwich', 'Oxford', 'Plymouth', 'Portsmouth',
  'Preston', 'Sheffield', 'Stoke', 'Sunderland', 'Swansea', 'Watford',
  // League One
  'Barnsley', 'Birmingham', 'Blackpool', 'Bolton', 'Burton',
  'Cambridge', 'Charlton', 'Crawley', 'Exeter', 'Huddersfield',
  'Leyton', 'Lincoln', 'Northampton', 'Peterborough', 'Rotherham',
  'Shrewsbury', 'Stevenage', 'Stockport', 'Wigan', 'Wrexham', 'Wycombe',
  // League Two
  'Barrow', 'Bradford', 'Bromley', 'Carlisle', 'Cheltenham',
  'Chesterfield', 'Colchester', 'Crewe', 'Doncaster', 'Fleetwood',
  'Gillingham', 'Grimsby', 'Harrogate', 'Mansfield', 'Morecambe',
  'Newport', 'Salford', 'Swindon', 'Tranmere', 'Walsall', 'York',
  // National League
  'Aldershot', 'Altrincham', 'Gateshead', 'Kidderminster', 'Maidstone',
  'Oldham', 'Rochdale', 'Scunthorpe', 'Southend', 'Tamworth', 'Woking',
  'Notts', 'Reading', 'Halifax',
];

// Descriptor parts extracted from English football clubs
const DESCRIPTOR_PARTS = [
  'United', 'City', 'Town', 'Rovers', 'Athletic', 'County',
  'Wanderers', 'Forest', 'Hotspur', 'Argyle', 'Villa', 'Palace',
  'Albion', 'Rangers', 'Alexandra', 'Orient', 'Harriers', 'Borough',
  'North End', 'Wednesday', 'Park Rangers',
];

// Full list of actual real English football team names to filter out
// (covers Premier League + Championship + League One + League Two + National League)
const REAL_TEAM_NAMES = new Set([
  // Premier League
  'Arsenal', 'Arsenal FC', 'Arsenal United', 'Aston Villa', 'Bournemouth',
  'AFC Bournemouth', 'Brentford', 'Brighton & Hove Albion', 'Brighton City',
  'Chelsea', 'Chelsea FC', 'Crystal Palace', 'Everton', 'Fulham',
  'Ipswich Town', 'Leicester City', 'Liverpool', 'Liverpool FC',
  'Manchester City', 'Manchester United', 'Newcastle United',
  'Nottingham Forest', 'Southampton', 'Tottenham Hotspur', 'Tottenham United',
  'West Ham United', 'Wolverhampton Wanderers',
  // Championship
  'Blackburn Rovers', 'Bristol City', 'Bristol Rovers', 'Burnley',
  'Cardiff City', 'Coventry City', 'Derby County', 'Hull City',
  'Leeds United', 'Luton Town', 'Middlesbrough', 'Millwall',
  'Norwich City', 'Oxford United', 'Plymouth Argyle', 'Portsmouth',
  'Preston North End', 'Queens Park Rangers', 'Sheffield United',
  'Sheffield Wednesday', 'Stoke City', 'Sunderland', 'Swansea City', 'Watford',
  'West Bromwich Albion',
  // League One
  'Barnsley', 'Birmingham City', 'Blackpool', 'Bolton Wanderers',
  'Burton Albion', 'Cambridge United', 'Charlton Athletic', 'Crawley Town',
  'Exeter City', 'Huddersfield Town', 'Leyton Orient', 'Lincoln City',
  'Northampton Town', 'Peterborough United', 'Reading', 'Rotherham United',
  'Shrewsbury Town', 'Stevenage', 'Stockport County', 'Wigan Athletic',
  'Wrexham', 'Wycombe Wanderers', 'MK Dons', 'AFC Wimbledon',
  // League Two
  'Barrow', 'Bradford City', 'Bromley', 'Carlisle United', 'Cheltenham Town',
  'Chesterfield', 'Colchester United', 'Crewe Alexandra', 'Doncaster Rovers',
  'Fleetwood Town', 'Gillingham', 'Grimsby Town', 'Harrogate Town',
  'Mansfield Town', 'Morecambe', 'Newport County', 'Notts County', 'Salford City',
  'Swindon Town', 'Tranmere Rovers', 'Walsall', 'York City',
  // National League
  'Aldershot Town', 'Altrincham', 'Boreham Wood', 'Boston United',
  'Braintree Town', 'Chester', 'Dagenham & Redbridge', 'Eastleigh',
  'FC Halifax Town', 'Halifax Town', 'Gateshead', 'Kidderminster Harriers',
  'Maidstone United', 'Oldham Athletic', 'Rochdale', 'Scunthorpe United',
  'Solihull Moors', 'Southend United', 'Tamworth', 'Wealdstone', 'Weymouth',
  'Woking',
]);

const BADGE_COLORS = [
  '#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#3949AB',
  '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047',
  '#7CB342', '#C0CA33', '#FDD835', '#FFB300', '#FB8C00',
  '#F4511E', '#6D4C41', '#546E7A', '#1565C0', '#AD1457',
];

function generateClubName(rng: () => number, usedNames: Set<string>): string {
  const maxAttempts = 200;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const place = PLACE_PARTS[Math.floor(rng() * PLACE_PARTS.length)];
    const descriptor = DESCRIPTOR_PARTS[Math.floor(rng() * DESCRIPTOR_PARTS.length)];
    const name = `${place} ${descriptor}`;

    if (!usedNames.has(name) && !REAL_TEAM_NAMES.has(name)) {
      usedNames.add(name);
      return name;
    }
  }

  // Fallback: guaranteed unique name
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
