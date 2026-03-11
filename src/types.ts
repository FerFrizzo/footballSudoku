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

export const WIN_DIALOGUES = [
  "Brilliant! Three points in the bag. The squad is buzzing after that display!",
  "Outstanding performance! The fans will be talking about this one for weeks.",
  "What a win! The gaffer is absolutely delighted. Dressing room morale is sky-high!",
  "Three points secured! That is the kind of performance that gets scouts talking.",
  "A masterclass today. The chairman has noticed and word is spreading fast.",
  "Victory! The atmosphere in the dressing room is electric right now.",
  "Textbook from start to finish. The opposition barely had a look in.",
  "Maximum points! The tactical approach was spot on from the first whistle.",
  "Unstoppable today. Three points keeps us right in the hunt at the top of the table!",
  "Magnificent! The Supporters Trust has voted you Player of the Match.",
  "That win sends a message to every team in this division. We mean business.",
  "The lads followed your lead and delivered. Three very well-earned points.",
  "Match intelligence like that is rare. The youth players watched and took notes.",
  "Dominant from start to finish. The table is looking very healthy right now.",
  "New contract talk is heating up after a display like that. Win well earned.",
];

export const DRAW_DIALOGUES = [
  "A point on the board. Solid show today, though we know there is more to give.",
  "Not the result we wanted, but we stayed composed. A draw keeps us in touch.",
  "Tough opponent today. We take the point and move on to the next challenge.",
  "Hard-fought draw. The resilience shown today was exactly what this club needs.",
  "A fair result in a tight contest. We dust ourselves off and go again next time.",
  "One point earned. Keep that focus and the wins will come.",
  "Competitive performance today. A draw is not a disaster — we stay in the fight.",
  "We matched them all the way. That point could be valuable come end of season.",
  "Honours even. The character shown was encouraging. We build on this.",
  "Proud of the effort today. A point here could still prove very important.",
];

export const LOSS_DIALOGUES = [
  "Tough one to take. But the best players use defeat as fuel. Come back stronger.",
  "That result hurts. Regroup, recover, and be ready to answer back next matchday.",
  "Not our day, but one result does not define a season. Stay focused.",
  "A difficult afternoon. The squad needs to reflect and come back with more.",
  "Defeat is part of the journey. What matters now is how we respond.",
  "Hard to take, but every champion has been here. The question is what happens next.",
  "We owe the fans better. Use this as motivation and go again next match.",
  "That one went against us. Chin up — we need a reaction in the very next game.",
  "No sugarcoating it: we were second best today. The work starts again tomorrow.",
  "A setback, not a surrender. The table still has everything to play for.",
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
