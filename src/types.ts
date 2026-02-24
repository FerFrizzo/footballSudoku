export interface ClubProfile {
  name: string;
  badgeUri: string | null;
  primaryColor: string;
  secondaryColor: string;
}

export interface LevelProgress {
  starsBest: number;
  bestTimeSec: number | null;
  completedAt: string | null;
}

export type DifficultyTag = 'super_easy' | 'easy' | 'medium' | 'hard' | 'very_hard';

export interface DivisionConfig {
  id: string;
  name: string;
  subtitle: string;
  difficulty: DifficultyTag;
  givensMin: number;
  givensMax: number;
  starsToUnlock: number;
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
    name: 'National League',
    subtitle: 'Division 5',
    difficulty: 'super_easy',
    givensMin: 45,
    givensMax: 50,
    starsToUnlock: 0,
    levelCount: 10,
    narrativeIntro: 'Welcome to the National League! Your journey through English football begins here. Show the board you have what it takes!',
    icon: 'football-outline',
  },
  {
    id: '2',
    name: 'League Two',
    subtitle: 'Division 4',
    difficulty: 'easy',
    givensMin: 38,
    givensMax: 44,
    starsToUnlock: 15,
    levelCount: 10,
    narrativeIntro: 'Promotion to League Two! The competition is heating up. Your tactical mind is being noticed by bigger clubs.',
    icon: 'shield-outline',
  },
  {
    id: '3',
    name: 'League One',
    subtitle: 'Division 3',
    difficulty: 'medium',
    givensMin: 32,
    givensMax: 37,
    starsToUnlock: 25,
    levelCount: 10,
    narrativeIntro: 'League One awaits! The midfield battles are tougher now. Every puzzle is a match that could define your season.',
    icon: 'trophy-outline',
  },
  {
    id: '4',
    name: 'Championship',
    subtitle: 'Division 2',
    difficulty: 'hard',
    givensMin: 28,
    givensMax: 31,
    starsToUnlock: 35,
    levelCount: 10,
    narrativeIntro: 'The Championship! One step from the promised land. The pressure is immense, only the sharpest minds survive.',
    icon: 'medal-outline',
  },
  {
    id: '5',
    name: 'Premier League',
    subtitle: 'Division 1',
    difficulty: 'very_hard',
    givensMin: 22,
    givensMax: 27,
    starsToUnlock: 50,
    levelCount: 10,
    narrativeIntro: 'THE PREMIER LEAGUE! You have reached the pinnacle. Only world-class puzzle skills will keep you here.',
    icon: 'star-outline',
  },
];

export const COMPLETION_DIALOGUES = [
  "Great result today! The fans are buzzing after that performance.",
  "The gaffer is pleased with your display. Keep that form going!",
  "That was a tactical masterclass out there. The scouts are taking notice.",
  "Three points in the bag! On to the next fixture.",
  "The chairman has noticed your recent form. Good things are coming.",
  "What a display of skill! You are becoming a fan favourite.",
  "Solid performance. The dressing room morale has never been higher.",
  "The local press is raving about your match intelligence!",
  "Training has paid off. You are getting sharper with every match day.",
  "The Supporters' Trust voted you Player of the Match!",
  "The youth academy players are looking up to you now.",
  "Talk of a new contract is circulating around the training ground.",
  "A clean sheet performance! The defence was watertight today.",
  "The kit man says he has never seen anyone work this hard.",
  "Post-match interview went brilliantly. The media loves you.",
];

export const PROMOTION_DIALOGUES: Record<string, string> = {
  '2': "PROMOTED! You have earned your place in League Two. The real challenge begins now. Can you handle the step up?",
  '3': "PROMOTED! League One is calling your name. The quality of opposition is about to get serious.",
  '4': "PROMOTED! The Championship awaits! You are knocking on the door of the big time now.",
  '5': "PROMOTED! THE PREMIER LEAGUE! You have reached the summit of English football. This is what dreams are made of!",
};

export const DIFFICULTY_LABELS: Record<DifficultyTag, string> = {
  super_easy: 'Beginner',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  very_hard: 'Expert',
};

export const HINT_COST_GEMS = 10;
export const FREE_HINTS_PER_LEVEL = 1;
export const PREMIUM_HINTS_PER_LEVEL = 99;
