export type GameDifficulty = 'easy' | 'medium' | 'hard';

export type CognitiveGameId = 'memory-match' | 'remember-objects' | 'sequence-memory';

export interface CulturalItem {
  id: string;
  name: string;
  localName?: string;
  emoji: string;
  category: 'nature' | 'culture' | 'daily' | 'wildlife';
  color: string;
  culturalNote?: string;
}

export interface GameResult {
  gameId: CognitiveGameId;
  gameTitle: string;
  difficulty: GameDifficulty;
  score: number;
  maxScore: number;
  accuracy: number; // percentage (0 - 100)
  durationSeconds: number;
  reactionTimeMs?: number;
  attempts: number;
  completedAt: string;
  encouragingFeedback: string;
  adaptiveReason?: string;
}

export interface WeeklyActivityDay {
  dayName: string; // 'Mon', 'Tue', etc.
  dateStr: string; // YYYY-MM-DD
  isToday: boolean;
  completed: boolean;
  gamesCount: number;
}

export interface CognitiveJourneyStats {
  currentStreak: number; // in days
  bestStreak: number;
  totalGamesCompleted: number;
  averageAccuracy: number; // percentage (0 - 100)
  weeklyActivity: WeeklyActivityDay[];
  recentSessions: GameResult[];
  adaptiveLevels: Record<CognitiveGameId, { difficulty: GameDifficulty; reason: string }>;
}
