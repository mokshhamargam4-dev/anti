import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { GameResult, CognitiveJourneyStats, WeeklyActivityDay, CognitiveGameId } from '../types/games';
import { calculateAdaptiveDifficulty, getEncouragingMessage } from './adaptiveDifficulty';

export { getEncouragingMessage };

const LOCAL_STORAGE_KEY = 'smriti_game_sessions';
const STREAK_KEY = 'smriti_cognitive_streak';

/**
 * Saves a completed game session to both Supabase and LocalStorage.
 */
export const saveGameSession = async (
  userId: string | undefined,
  result: GameResult
): Promise<void> => {
  // 1. Always save to LocalStorage for instant reactive updates and offline resilience
  try {
    const existing = getLocalSessions();
    existing.unshift(result);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing.slice(0, 50)));
    updateLocalStreak(result.completedAt);
  } catch (err) {
    console.warn('Local save warning:', err);
  }

  // 2. Persist to Supabase if configured and authenticated
  if (isSupabaseConfigured() && userId) {
    try {
      const { error } = await supabase.from('game_sessions').insert({
        elderly_id: userId,
        game_type: result.gameId,
        difficulty_level: result.difficulty,
        score: result.score,
        max_score: result.maxScore,
        duration_seconds: result.durationSeconds,
        accuracy_rate: result.accuracy,
        metrics: {
          attempts: result.attempts,
          reaction_time_ms: result.reactionTimeMs ?? Math.round((result.durationSeconds * 1000) / Math.max(1, result.attempts)),
          title: result.gameTitle,
          adaptive_reason: result.adaptiveReason || 'Standard progression',
        },
        completed_at: result.completedAt,
      });

      if (error) {
        console.warn('Supabase game_sessions insert error:', error.message);
      }
    } catch (dbErr) {
      console.warn('Supabase network error saving session:', dbErr);
    }
  }
};

/**
 * Fetches game history from Supabase if authenticated, otherwise returns LocalStorage sessions.
 */
export const fetchUserGameHistory = async (userId: string | undefined): Promise<GameResult[]> => {
  if (isSupabaseConfigured() && userId) {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('elderly_id', userId)
        .order('completed_at', { ascending: false })
        .limit(50);

      if (!error && data && data.length > 0) {
        // Map database records to GameResult
        const mapped: GameResult[] = data.map((row: any) => ({
          gameId: row.game_type as CognitiveGameId,
          gameTitle: getGameTitle(row.game_type),
          difficulty: row.difficulty_level,
          score: row.score,
          maxScore: row.max_score || 100,
          accuracy: Number(row.accuracy_rate) || 0,
          durationSeconds: row.duration_seconds || 0,
          reactionTimeMs: row.metrics?.reaction_time_ms,
          attempts: row.metrics?.attempts || 1,
          completedAt: row.completed_at || row.created_at,
          encouragingFeedback: getEncouragingMessage(Number(row.accuracy_rate) || 0, row.difficulty_level),
          adaptiveReason: row.metrics?.adaptive_reason,
        }));

        // Sync to local storage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('Could not query Supabase, falling back to local history:', err);
    }
  }

  return getLocalSessions();
};

export const getLocalSessions = (): GameResult[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) return getInitialDemoSessions();
    return JSON.parse(data) as GameResult[];
  } catch {
    return getInitialDemoSessions();
  }
};

/**
 * Computes full Cognitive Journey statistics from sessions.
 */
export const calculateCognitiveJourney = (sessions: GameResult[]): CognitiveJourneyStats => {
  const total = sessions.length;
  const avgAccuracy =
    total > 0
      ? Math.round(sessions.reduce((acc, curr) => acc + curr.accuracy, 0) / total)
      : 85;

  const currentStreak = calculateConsecutiveStreak(sessions);
  const bestStreak = Math.max(currentStreak, parseInt(localStorage.getItem(STREAK_KEY) || '4', 10));

  // Compute 7-day weekly activity map (Past 7 days up to today)
  const weeklyActivity: WeeklyActivityDay[] = [];
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const matchingSessions = sessions.filter(s => s.completedAt.startsWith(dateStr));

    weeklyActivity.push({
      dayName: dayNames[d.getDay()],
      dateStr,
      isToday: i === 0,
      completed: matchingSessions.length > 0,
      gamesCount: matchingSessions.length,
    });
  }

  // Calculate adaptive difficulty for each of the 3 games
  const adaptiveLevels: CognitiveJourneyStats['adaptiveLevels'] = {
    'memory-match': calculateAdaptiveDifficulty('memory-match', sessions),
    'remember-objects': calculateAdaptiveDifficulty('remember-objects', sessions),
    'sequence-memory': calculateAdaptiveDifficulty('sequence-memory', sessions),
  };

  return {
    currentStreak,
    bestStreak,
    totalGamesCompleted: total,
    averageAccuracy: avgAccuracy,
    weeklyActivity,
    recentSessions: sessions.slice(0, 5),
    adaptiveLevels,
  };
};

const calculateConsecutiveStreak = (sessions: GameResult[]): number => {
  if (sessions.length === 0) return 1;

  const uniqueDays = Array.from(
    new Set(sessions.map(s => s.completedAt.split('T')[0]))
  ).sort().reverse();

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];

    if (uniqueDays.includes(dayStr)) {
      streak++;
    } else if (i === 0) {
      // If haven't played yet today, check yesterday
      continue;
    } else {
      break;
    }
  }

  return Math.max(streak, 1);
};

const updateLocalStreak = (_completedAt: string) => {
  const current = parseInt(localStorage.getItem(STREAK_KEY) || '3', 10);
  localStorage.setItem(STREAK_KEY, String(current + 1));
};

const getGameTitle = (gameType: string): string => {
  switch (gameType) {
    case 'memory-match':
      return 'Memory Match Cards';
    case 'remember-objects':
      return 'Remember the Objects';
    case 'sequence-memory':
      return 'Sequence Memory';
    default:
      return 'Cognitive Game';
  }
};

const getInitialDemoSessions = (): GameResult[] => [
  {
    gameId: 'memory-match',
    gameTitle: 'Memory Match Cards',
    difficulty: 'easy',
    score: 95,
    maxScore: 100,
    accuracy: 94,
    durationSeconds: 38,
    reactionTimeMs: 2700,
    attempts: 6,
    completedAt: new Date(Date.now() - 86400000).toISOString(),
    encouragingFeedback: 'Wonderful memory recall with familiar Assam cultural symbols!',
    adaptiveReason: 'Strong initial baseline',
  },
  {
    gameId: 'remember-objects',
    gameTitle: 'Remember the Objects',
    difficulty: 'easy',
    score: 88,
    maxScore: 100,
    accuracy: 90,
    durationSeconds: 45,
    reactionTimeMs: 3100,
    attempts: 4,
    completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    encouragingFeedback: 'Great focus identifying North Eastern wildlife & artifacts.',
    adaptiveReason: 'Strong initial baseline',
  },
  {
    gameId: 'sequence-memory',
    gameTitle: 'Sequence Memory',
    difficulty: 'easy',
    score: 90,
    maxScore: 100,
    accuracy: 92,
    durationSeconds: 40,
    reactionTimeMs: 2500,
    attempts: 3,
    completedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    encouragingFeedback: 'Excellent rhythm and calm sequence reproduction!',
    adaptiveReason: 'Strong initial baseline',
  },
];
