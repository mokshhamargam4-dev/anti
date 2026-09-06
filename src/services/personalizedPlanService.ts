import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { GameResult, CognitiveGameId, GameDifficulty } from '../types/games';
import { SimpleMood, PersonalizedDailyPlan, PersonalizedActivity, MoodRecord } from '../types/plan';
import { calculateAdaptiveDifficulty } from './adaptiveDifficulty';

const MOOD_STORAGE_KEY = 'smriti_daily_mood';
const PLAN_STORAGE_KEY = 'smriti_personalized_plan';

export const NON_MEDICAL_MOOD_DISCLAIMER =
  'Self-reported mood reflects daily personal comfort and energy. It is not interpreted as a medical condition, psychiatric diagnosis, or clinical assessment.';

export const MOOD_DEFINITIONS: Record<SimpleMood, { label: string; emoji: string; description: string; score: number }> = {
  good: {
    label: 'Good',
    emoji: '😊',
    description: 'Feeling cheerful, alert & comfortable',
    score: 5,
  },
  okay: {
    label: 'Okay',
    emoji: '🙂',
    description: 'Feeling steady, neutral & calm',
    score: 3,
  },
  not_good: {
    label: 'Not good',
    emoji: '😔',
    description: 'Feeling a bit tired or low today',
    score: 1,
  },
};

const GAME_METADATA: Record<CognitiveGameId, { title: string; description: string; icon: string }> = {
  'memory-match': {
    title: 'Memory Match Cards',
    description: 'Flip and pair familiar North Eastern cultural symbols like the tea kettle and rhino.',
    icon: '🎴',
  },
  'remember-objects': {
    title: 'Remember the Objects',
    description: 'Observe familiar everyday objects, then recall which items were shown.',
    icon: '👀',
  },
  'sequence-memory': {
    title: 'Sequence Memory',
    description: 'Watch rhythmic sensory patterns light up and repeat them in order.',
    icon: '🥁',
  },
};

/**
 * Deterministic recommendation engine generating 2 to 3 tailored cognitive activities
 */
export const generatePersonalizedPlan = (
  sessions: GameResult[],
  mood: SimpleMood | null,
  streak: number
): PersonalizedDailyPlan => {
  const todayStr = new Date().toISOString().split('T')[0];
  const allGameIds: CognitiveGameId[] = ['memory-match', 'remember-objects', 'sequence-memory'];

  // Check which games have been completed today
  const todayCompletedGameIds = new Set(
    sessions.filter(s => s.completedAt.startsWith(todayStr)).map(s => s.gameId)
  );

  // Analyze metrics per game
  const gameStats = allGameIds.map(gameId => {
    const matching = sessions.filter(s => s.gameId === gameId);
    const lastSession = matching[0];
    const recent3 = matching.slice(0, 3);
    const avgAccuracy =
      recent3.length > 0
        ? Math.round(recent3.reduce((acc, s) => acc + s.accuracy, 0) / recent3.length)
        : 0;
    const adaptive = calculateAdaptiveDifficulty(gameId, sessions);

    return {
      gameId,
      timesPlayed: matching.length,
      lastPlayedMs: lastSession ? new Date(lastSession.completedAt).getTime() : 0,
      avgAccuracy,
      adaptiveDifficulty: adaptive.difficulty,
    };
  });

  const activities: PersonalizedActivity[] = [];

  // =========================================================================
  // RULE 1: MOOD-RESPONSIVE ADAPTATION
  // If patient feels "Not good", recommend exactly 2 gentle, low-pressure activities
  // =========================================================================
  if (mood === 'not_good') {
    // Activity 1: Gentle Memory Match on Easy
    activities.push({
      id: `act-mood-1-${todayStr}`,
      gameId: 'memory-match',
      title: GAME_METADATA['memory-match'].title,
      description: GAME_METADATA['memory-match'].description,
      difficulty: 'easy',
      estimatedMinutes: 3,
      reason: 'Selected for a gentle, relaxing session to match your comfort today.',
      badge: 'Gentle Pace',
      icon: GAME_METADATA['memory-match'].icon,
      isCompleted: todayCompletedGameIds.has('memory-match'),
    });

    // Activity 2: Gentle Remember Objects on Easy
    activities.push({
      id: `act-mood-2-${todayStr}`,
      gameId: 'remember-objects',
      title: GAME_METADATA['remember-objects'].title,
      description: GAME_METADATA['remember-objects'].description,
      difficulty: 'easy',
      estimatedMinutes: 3,
      reason: 'Recommended for calm, stress-free engagement with familiar North Eastern sights.',
      badge: 'Comfort Routine',
      icon: GAME_METADATA['remember-objects'].icon,
      isCompleted: todayCompletedGameIds.has('remember-objects'),
    });

    return {
      planDate: todayStr,
      mood,
      overallGoal: 'Gentle, low-pressure cognitive comfort and emotional peace today.',
      activities,
      generatedAt: new Date().toISOString(),
    };
  }

  // =========================================================================
  // RULE 2: RECENCY ROTATION (Pick least-recently played game first)
  // Ensures all 3 games are practiced and avoids repeating the same game
  // =========================================================================
  const sortedByRecency = [...gameStats].sort((a, b) => a.lastPlayedMs - b.lastPlayedMs);
  const leastRecent = sortedByRecency[0];

  activities.push({
    id: `act-recency-${leastRecent.gameId}-${todayStr}`,
    gameId: leastRecent.gameId,
    title: GAME_METADATA[leastRecent.gameId].title,
    description: GAME_METADATA[leastRecent.gameId].description,
    difficulty: leastRecent.adaptiveDifficulty,
    estimatedMinutes: 4,
    reason: 'Recommended to keep your weekly practice balanced across different memory skills.',
    badge: 'Skill Balance',
    icon: GAME_METADATA[leastRecent.gameId].icon,
    isCompleted: todayCompletedGameIds.has(leastRecent.gameId),
  });

  // =========================================================================
  // RULE 3: PERFORMANCE-BASED CALIBRATION
  // Evaluate games needing supportive practice vs. mastery celebration
  // =========================================================================
  const remainingAfterRecency = gameStats.filter(g => g.gameId !== leastRecent.gameId);
  // Sort remaining by accuracy ascending
  remainingAfterRecency.sort((a, b) => a.avgAccuracy - b.avgAccuracy);
  const candidateForPerformance = remainingAfterRecency[0];

  let perfReason = 'Recommended to maintain your steady, calm practice rhythm.';
  let perfBadge = 'Core Practice';
  let perfDiff = candidateForPerformance.adaptiveDifficulty;

  if (candidateForPerformance.avgAccuracy > 0 && candidateForPerformance.avgAccuracy < 75) {
    perfReason = 'Recommended for gentle practice to build confidence at your own comfortable pace.';
    perfBadge = 'Confidence Builder';
    perfDiff = 'easy'; // Offer easier level for confidence
  } else if (candidateForPerformance.avgAccuracy >= 85) {
    perfReason = 'Recommended to celebrate your strong focus in recent sessions.';
    perfBadge = 'Mastery Focus';
  }

  activities.push({
    id: `act-perf-${candidateForPerformance.gameId}-${todayStr}`,
    gameId: candidateForPerformance.gameId,
    title: GAME_METADATA[candidateForPerformance.gameId].title,
    description: GAME_METADATA[candidateForPerformance.gameId].description,
    difficulty: perfDiff,
    estimatedMinutes: 4,
    reason: perfReason,
    badge: perfBadge,
    icon: GAME_METADATA[candidateForPerformance.gameId].icon,
    isCompleted: todayCompletedGameIds.has(candidateForPerformance.gameId),
  });

  // =========================================================================
  // RULE 4: STREAK CONTINUATION & ROUNDED COMPLETION (3rd Activity)
  // =========================================================================
  const lastRemaining = remainingAfterRecency[1];
  let streakReason = 'Recommended to round out your daily routine with fun pattern recognition.';
  let streakBadge = 'Daily Routine';

  if (streak >= 3) {
    streakReason = 'Recommended as a rewarding exercise to continue your active daily streak.';
    streakBadge = 'Streak Milestone';
  }

  activities.push({
    id: `act-streak-${lastRemaining.gameId}-${todayStr}`,
    gameId: lastRemaining.gameId,
    title: GAME_METADATA[lastRemaining.gameId].title,
    description: GAME_METADATA[lastRemaining.gameId].description,
    difficulty: lastRemaining.adaptiveDifficulty,
    estimatedMinutes: 4,
    reason: streakReason,
    badge: streakBadge,
    icon: GAME_METADATA[lastRemaining.gameId].icon,
    isCompleted: todayCompletedGameIds.has(lastRemaining.gameId),
  });

  return {
    planDate: todayStr,
    mood,
    overallGoal: 'Well-rounded cognitive stimulation covering visual recall, cultural memory, and pattern rhythm.',
    activities,
    generatedAt: new Date().toISOString(),
  };
};

/**
 * Saves self-reported mood to both Supabase and LocalStorage
 */
export const saveMoodCheckin = async (
  userId: string | undefined,
  mood: SimpleMood,
  notes?: string
): Promise<void> => {
  const def = MOOD_DEFINITIONS[mood];
  const record: MoodRecord = {
    mood,
    label: def.label,
    emoji: def.emoji,
    timestamp: new Date().toISOString(),
    notes,
  };

  // 1. Save to LocalStorage
  try {
    localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(record));
  } catch (err) {
    console.warn('Could not save mood locally:', err);
  }

  // 2. Persist to Supabase mood_checkins table
  if (isSupabaseConfigured() && userId) {
    try {
      await supabase.from('mood_checkins').insert({
        elderly_id: userId,
        mood_score: def.score,
        dominant_emotion: mood,
        notes: notes || `Self-reported feeling: ${def.label}`,
        checkin_time: record.timestamp,
      });
    } catch (dbErr) {
      console.warn('Could not save mood to Supabase:', dbErr);
    }
  }
};

/**
 * Retrieves the latest self-reported mood
 */
export const getStoredMood = (): MoodRecord | null => {
  try {
    const data = localStorage.getItem(MOOD_STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as MoodRecord;
  } catch {
    return null;
  }
};

/**
 * Syncs the generated personalized plan to Supabase daily_plans and LocalStorage
 */
export const syncPersonalizedPlan = async (
  userId: string | undefined,
  plan: PersonalizedDailyPlan
): Promise<void> => {
  try {
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
  } catch (err) {
    console.warn('Could not cache plan locally:', err);
  }

  // Sync each activity to daily_plans if authenticated
  if (isSupabaseConfigured() && userId) {
    try {
      for (const act of plan.activities) {
        await supabase.from('daily_plans').upsert(
          {
            elderly_id: userId,
            title: act.title,
            description: `${act.badge}: ${act.reason}`,
            plan_date: plan.planDate,
            activity_type: 'cognitive_game',
            is_completed: act.isCompleted,
          },
          { onConflict: 'elderly_id,plan_date,title' }
        );
      }
    } catch (err) {
      console.warn('Daily plans sync notice:', err);
    }
  }
};
