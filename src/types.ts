export interface ClubProfile {
  name: string;
  badgeUri: string | null;
  primaryColor: string;
  secondaryColor: string;
}

export interface MatchdayProgress {
  starsBest: number;
  bestTimeSec: number | null;
  completedAt: string | null;
  result?: 'win' | 'draw' | 'loss';
}

export interface LeagueTeam {
  id: string;
  name: string;
  badgeSeedColor: string;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  isUser: boolean;
}

export interface DivisionLeague {
  teams: LeagueTeam[];
  matchdays: MatchdayProgress[];
  currentMatchday: number;
  userTeamId: string;
  divisionStatus: 'locked' | 'unlocked' | 'completed';
}

export interface DivisionConfig {
  id: string;
  name: string;
  subtitle: string;
  tier: number;
  givensMin: number;
  givensMax: number;
  levelCount: number;
  narrativeIntro: string;
  icon: string;
}

export interface AnalyticsEvent {
  eventName: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export const DIVISIONS: DivisionConfig[] = [
  {
    id: '1',
    name: 'Elite Division',
    subtitle: 'Tier 1',
    tier: 1,
    givensMin: 22,
    givensMax: 25,
    levelCount: 20,
    narrativeIntro: 'The pinnacle of the pyramid. Only the most brilliant tactical minds survive here. Every matchday is a battle of wits at the highest level.',
    icon: 'star-outline',
  },
  {
    id: '2',
    name: 'Crown Division',
    subtitle: 'Tier 2',
    tier: 2,
    givensMin: 26,
    givensMax: 28,
    levelCount: 20,
    narrativeIntro: 'The Crown Division is where legends are forged. One step from the summit, the pressure is immense.',
    icon: 'ribbon-outline',
  },
  {
    id: '3',
    name: 'Champion Division',
    subtitle: 'Tier 3',
    tier: 3,
    givensMin: 29,
    givensMax: 31,
    levelCount: 20,
    narrativeIntro: 'Welcome to the Champion Division. The competition is fierce and every result matters in the race for promotion.',
    icon: 'trophy-outline',
  },
  {
    id: '4',
    name: 'National Division',
    subtitle: 'Tier 4',
    tier: 4,
    givensMin: 32,
    givensMax: 34,
    levelCount: 20,
    narrativeIntro: 'The National Division draws attention from across the land. Perform well and the bigger clubs will come calling.',
    icon: 'medal-outline',
  },
  {
    id: '5',
    name: 'Federation Division',
    subtitle: 'Tier 5',
    tier: 5,
    givensMin: 35,
    givensMax: 37,
    levelCount: 20,
    narrativeIntro: 'The Federation Division is where true contenders emerge. The quality of opposition is rising fast.',
    icon: 'shield-outline',
  },
  {
    id: '6',
    name: 'Regional Division',
    subtitle: 'Tier 6',
    tier: 6,
    givensMin: 38,
    givensMax: 40,
    levelCount: 20,
    narrativeIntro: 'Regional pride is on the line. Represent your area with distinction and climb the pyramid.',
    icon: 'flag-outline',
  },
  {
    id: '7',
    name: 'County Division',
    subtitle: 'Tier 7',
    tier: 7,
    givensMin: 41,
    givensMax: 43,
    levelCount: 20,
    narrativeIntro: 'The County Division is where ambitions take shape. Win here and greater challenges await.',
    icon: 'map-outline',
  },
  {
    id: '8',
    name: 'Borough Division',
    subtitle: 'Tier 8',
    tier: 8,
    givensMin: 44,
    givensMax: 46,
    levelCount: 20,
    narrativeIntro: 'Borough-level football, where local heroes are born. Every matchday brings the community together.',
    icon: 'home-outline',
  },
  {
    id: '9',
    name: 'Township Division',
    subtitle: 'Tier 9',
    tier: 9,
    givensMin: 47,
    givensMax: 49,
    levelCount: 20,
    narrativeIntro: 'The Township Division is where your journey gathers pace. Build form and the scouts will notice.',
    icon: 'people-outline',
  },
  {
    id: '10',
    name: 'Grassroots Division',
    subtitle: 'Tier 10',
    tier: 10,
    givensMin: 50,
    givensMax: 52,
    levelCount: 20,
    narrativeIntro: 'Welcome to the Grassroots Division! Your journey through the football pyramid begins here. Show the board you have what it takes!',
    icon: 'football-outline',
  },
];

export const DIVISION_DIFFICULTY_LABELS: Record<string, string> = {
  '1': 'Expert',
  '2': 'Very Hard',
  '3': 'Hard',
  '4': 'Challenging',
  '5': 'Intermediate+',
  '6': 'Intermediate',
  '7': 'Moderate',
  '8': 'Easy+',
  '9': 'Easy',
  '10': 'Beginner',
};

export const COMPLETION_DIALOGUES = [
  "Great result today! The fans are buzzing after that performance.",
  "The gaffer is pleased with your display. Keep that form going!",
  "That was a tactical masterclass out there. The scouts are taking notice.",
  "Three points in the bag! On to the next fixture.",
  "The chairman has noticed your recent form. Good things are coming.",
  "What a display of skill! You are becoming a fan favourite.",
  "Solid performance. The dressing room morale has never been higher.",
  "The local press is raving about your match intelligence!",
  "Training has paid off. You are getting sharper with every matchday.",
  "The Supporters Trust voted you Player of the Match!",
  "The youth academy players are looking up to you now.",
  "Talk of a new contract is circulating around the training ground.",
  "A clean sheet performance! The defence was watertight today.",
  "The kit man says he has never seen anyone work this hard.",
  "Post-match interview went brilliantly. The media loves you.",
];

export const PROMOTION_DIALOGUES: Record<string, string> = {
  '1': "PROMOTED! THE ELITE DIVISION! You have reached the summit of the pyramid. This is what dreams are made of!",
  '2': "PROMOTED! The Crown Division awaits! You are knocking on the door of greatness now.",
  '3': "PROMOTED! The Champion Division is calling your name. The quality of opposition is about to get serious.",
  '4': "PROMOTED! You have earned your place in the National Division. The real challenge begins now.",
  '5': "PROMOTED! The Federation Division beckons! Can you handle the step up?",
  '6': "PROMOTED! Regional glory awaits! You have outgrown your division and earned your place among stronger clubs.",
  '7': "PROMOTED! The County Division is yours! Your tactical mind is being noticed by bigger clubs.",
  '8': "PROMOTED! Borough-level football! Your rise through the pyramid continues.",
  '9': "PROMOTED! The Township Division opens its doors. You have proven yourself at the grassroots level!",
};

export const RELEGATION_DIALOGUES: Record<string, string> = {
  '2': "RELEGATED. The drop to the Crown Division is a setback, but champions bounce back. Regroup and return stronger.",
  '3': "RELEGATED. Falling to the Champion Division hurts, but use this as motivation to rebuild.",
  '4': "RELEGATED. The National Division awaits. Dust yourself off and fight your way back.",
  '5': "RELEGATED. Back to the Federation Division. The board expects an immediate response.",
  '6': "RELEGATED. The Regional Division calls once more. Learn from the experience and come back stronger.",
  '7': "RELEGATED. Returning to the County Division. It is not how you fall, but how you get back up.",
  '8': "RELEGATED. The Borough Division is where you will rebuild. The fans still believe in you.",
  '9': "RELEGATED. Back to Township level. But every great story has setbacks. Write your comeback.",
  '10': "RELEGATED. The Grassroots Division. Rock bottom, but the only way is up. Start again.",
};

export const HINT_COST_GEMS = 10;
export const FREE_HINTS_PER_LEVEL = 1;
export const PREMIUM_HINTS_PER_LEVEL = 99;
