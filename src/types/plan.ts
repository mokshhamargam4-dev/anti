import { CognitiveGameId, GameDifficulty } from './games';

export type SimpleMood = 'good' | 'okay' | 'not_good';

export interface MoodRecord {
  mood: SimpleMood;
  label: string;
  emoji: string;
  timestamp: string;
  notes?: string;
}

export interface PersonalizedActivity {
  id: string;
  gameId: CognitiveGameId;
  title: string;
  description: string;
  difficulty: GameDifficulty;
  estimatedMinutes: number;
  reason: string; // "Why this activity was selected"
  badge: string;  // e.g. "Skill Balance", "Gentle Pace", "Confidence Builder"
  icon: string;   // emoji representation
  isCompleted: boolean;
}

export interface PersonalizedDailyPlan {
  planDate: string;
  mood: SimpleMood | null;
  overallGoal: string;
  activities: PersonalizedActivity[];
  generatedAt: string;
}
