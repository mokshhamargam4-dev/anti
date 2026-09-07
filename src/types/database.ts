export type UserRole = 'elderly' | 'caregiver';

export type DementiaStage = 'mild' | 'moderate' | 'severe' | 'not_applicable';

export type LinkStatus = 'active' | 'pending' | 'revoked';

export type GameType = 'memory_match' | 'pattern_recall' | 'ner_cultural_quiz' | 'audio_recollection';

export type ActivityType = 'medication' | 'cognitive_game' | 'walk' | 'meal' | 'family_call' | 'cultural_music' | 'routine';

export type MemoryItemType = 'person' | 'place' | 'event' | 'song_rhyme' | 'cultural_artifact';

export type DominantEmotion = 'happy' | 'calm' | 'neutral' | 'confused' | 'sad' | 'agitated';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  patient_code?: string | null;
  preferred_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  region?: string | null;
  primary_language?: string | null;
  dementia_stage?: DementiaStage | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaregiverLink {
  id: string;
  caregiver_id: string;
  elderly_id: string;
  relationship: string;
  status: LinkStatus;
  permissions?: {
    view_metrics?: boolean;
    manage_daily_plan?: boolean;
    manage_memories?: boolean;
  } | null;
  created_at: string;
  updated_at: string;
  // Joined elderly profile for caregiver views
  elderly_profile?: Profile;
  caregiver_profile?: Profile;
}

export interface GameSession {
  id: string;
  elderly_id: string;
  game_type: GameType | string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  score: number;
  max_score: number;
  duration_seconds: number;
  accuracy_rate: number;
  metrics?: Record<string, unknown> | null;
  completed_at: string;
  created_at: string;
}

export interface MoodCheckin {
  id: string;
  elderly_id: string;
  mood_score: number; // 1-5
  energy_level?: number | null; // 1-5
  dominant_emotion?: DominantEmotion | null;
  notes?: string | null;
  recorded_by?: string | null;
  checkin_time: string;
  created_at: string;
}

export interface DailyPlan {
  id: string;
  elderly_id: string;
  title: string;
  description?: string | null;
  plan_date: string;
  scheduled_time?: string | null;
  activity_type: ActivityType;
  is_completed: boolean;
  completed_at?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemoryItem {
  id: string;
  elderly_id: string;
  title: string;
  description?: string | null;
  item_type: MemoryItemType;
  media_url?: string | null;
  cultural_tag?: string | null;
  familiarity_rating?: number | null;
  prompts?: string[] | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EngagementSnapshot {
  id: string;
  elderly_id: string;
  snapshot_date: string;
  total_active_minutes: number;
  games_played_count: number;
  avg_cognitive_score: number;
  dominant_mood?: string | null;
  memory_interaction_count: number;
  alert_flag: boolean;
  alert_reason?: string | null;
  summary_notes?: string | null;
  created_at: string;
}
