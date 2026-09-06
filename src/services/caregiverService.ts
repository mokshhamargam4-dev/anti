import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, DailyPlan } from '../types/database';
import { GameResult, CognitiveGameId, GameDifficulty } from '../types/games';
import { calculateAdaptiveDifficulty } from './adaptiveDifficulty';
import { generateCaregiverAlerts, CaregiverAlert } from './caregiverAlerts';
import { getLocalSessions } from './gameSessionService';

export interface LinkedPatientInfo {
  linkId: string;
  relationship: string;
  status: string;
  elderly: Profile;
}

export interface WeeklyActivityPoint {
  day: string; // 'Mon', 'Tue', etc.
  date: string; // YYYY-MM-DD
  games: number;
  minutes: number;
}

export interface AccuracyTrendPoint {
  sessionNumber: number;
  gameTitle: string;
  accuracy: number;
  score: number;
  date: string;
}

export interface GamePerformanceDistribution {
  gameId: CognitiveGameId;
  gameTitle: string;
  sessionsCount: number;
  avgScore: number;
  avgAccuracy: number;
  currentDifficulty: GameDifficulty;
}

export interface PatientAnalyticsSummary {
  elderlyProfile: Profile;
  totalGames: number;
  gamesThisWeek: number;
  averageScore: number;
  averageAccuracy: number;
  averageReactionTimeMs: number;
  averageDurationSeconds: number;
  averageAttempts: number;
  currentStreak: number;
  activeToday: boolean;
  todayGamesCount: number;
  weeklyActivity: WeeklyActivityPoint[];
  accuracyTrend: AccuracyTrendPoint[];
  gamePerformance: GamePerformanceDistribution[];
  recentSessions: GameResult[];
  dailyPlans: DailyPlan[];
  alerts: CaregiverAlert[];
  adaptiveDifficulties: Record<CognitiveGameId, { difficulty: GameDifficulty; reason: string }>;
  latestMood: MoodRecord | null;
  personalizedPlan: PersonalizedDailyPlan | null;
}

/**
 * Fetches all elderly patients linked to the caregiver via caregiver_links.
 */
export const fetchLinkedPatients = async (
  caregiverId: string | undefined
): Promise<LinkedPatientInfo[]> => {
  if (isSupabaseConfigured() && caregiverId) {
    try {
      const { data: links, error } = await supabase
        .from('caregiver_links')
        .select(`
          id,
          relationship,
          status,
          elderly:elderly_id (
            id,
            role,
            full_name,
            preferred_name,
            region,
            primary_language,
            dementia_stage,
            emergency_contact_name,
            emergency_contact_phone,
            created_at,
            updated_at
          )
        `)
        .eq('caregiver_id', caregiverId)
        .eq('status', 'active');

      if (!error && links && links.length > 0) {
        return links
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: any) => ({
            linkId: item.id,
            relationship: item.relationship,
            status: item.status,
            elderly: item.elderly as Profile,
          }))
          .filter(lp => Boolean(lp.elderly));
      }
    } catch (err) {
      console.warn('Could not query linked patients from Supabase:', err);
    }
  }

  // Graceful fallback for demo or unlinked state
  return [
    {
      linkId: 'link-default-1',
      relationship: 'Mother',
      status: 'active',
      elderly: {
        id: 'demo-patient-01',
        role: 'elderly',
        full_name: 'Pabitra Devi',
        preferred_name: 'Aai (Mother)',
        region: 'Guwahati, Assam',
        primary_language: 'Assamese',
        dementia_stage: 'mild',
        emergency_contact_name: 'Pranab Devi (Son)',
        emergency_contact_phone: '+91 98765 43210',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
  ];
};

/**
 * Loads complete real-time analytics for a linked elderly patient.
 */
export const fetchPatientFullAnalytics = async (
  elderly: Profile
): Promise<PatientAnalyticsSummary> => {
  let sessions: GameResult[] = [];
  let plans: DailyPlan[] = [];

  // 1. Fetch real game sessions from Supabase
  if (isSupabaseConfigured()) {
    try {
      const { data: dbSessions } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('elderly_id', elderly.id)
        .order('completed_at', { ascending: false })
        .limit(50);

      if (dbSessions && dbSessions.length > 0) {
        sessions = dbSessions.map((row: any) => ({
          gameId: row.game_type as CognitiveGameId,
          gameTitle: formatGameTitle(row.game_type),
          difficulty: row.difficulty_level,
          score: row.score,
          maxScore: row.max_score || 100,
          accuracy: Number(row.accuracy_rate) || 0,
          durationSeconds: row.duration_seconds || 0,
          reactionTimeMs: row.metrics?.reaction_time_ms,
          attempts: row.metrics?.attempts || 1,
          completedAt: row.completed_at || row.created_at,
          encouragingFeedback: 'Session recorded in database',
          adaptiveReason: row.metrics?.adaptive_reason,
        }));
      }

      const { data: dbPlans } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('elderly_id', elderly.id)
        .order('scheduled_time', { ascending: true });

      if (dbPlans && dbPlans.length > 0) {
        plans = dbPlans as DailyPlan[];
      }
    } catch (err) {
      console.warn('Error querying patient database analytics:', err);
    }
  }

  // If database has no records yet (e.g. fresh account or local demo), use synchronized local sessions
  if (sessions.length === 0) {
    sessions = getLocalSessions();
  }

  if (plans.length === 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    plans = [
      {
        id: 'plan-def-1',
        elderly_id: elderly.id,
        title: 'Morning Blood Pressure & Warm Water',
        description: 'Check BP and record in diary',
        plan_date: todayStr,
        scheduled_time: '08:30',
        activity_type: 'medication',
        is_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'plan-def-2',
        elderly_id: elderly.id,
        title: 'Cognitive Memory Recall Exercise',
        description: '15-minute card matching session',
        plan_date: todayStr,
        scheduled_time: '11:00',
        activity_type: 'cognitive_game',
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'plan-def-3',
        elderly_id: elderly.id,
        title: 'Evening Veranda Walk & Family Call',
        description: 'Gentle 20-minute walk with grandchildren',
        plan_date: todayStr,
        scheduled_time: '17:30',
        activity_type: 'walk',
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  // Calculate Aggregates
  const totalGames = sessions.length;
  const now = new Date();
  const past7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const gamesThisWeek = sessions.filter(s => new Date(s.completedAt) >= past7Days).length;

  const averageScore = totalGames > 0 ? Math.round(sessions.reduce((a, b) => a + b.score, 0) / totalGames) : 85;
  const averageAccuracy = totalGames > 0 ? Math.round(sessions.reduce((a, b) => a + b.accuracy, 0) / totalGames) : 88;
  const averageDurationSeconds = totalGames > 0 ? Math.round(sessions.reduce((a, b) => a + b.durationSeconds, 0) / totalGames) : 45;
  const averageAttempts = totalGames > 0 ? Math.round((sessions.reduce((a, b) => a + b.attempts, 0) / totalGames) * 10) / 10 : 4;

  const reactionTimes = sessions.map(s => s.reactionTimeMs).filter((t): t is number => typeof t === 'number');
  const averageReactionTimeMs = reactionTimes.length > 0 ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : 2850;

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => s.completedAt.startsWith(todayStr));
  const activeToday = todaySessions.length > 0;
  const todayGamesCount = todaySessions.length;

  const currentStreak = calculateStreakFromSessions(sessions);

  // Weekly Activity Chart (Past 7 Days)
  const weeklyActivity: WeeklyActivityPoint[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const daySessions = sessions.filter(s => s.completedAt.startsWith(dateStr));
    const minutes = Math.round(daySessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 60);

    weeklyActivity.push({
      day: dayNames[d.getDay()],
      date: dateStr,
      games: daySessions.length,
      minutes,
    });
  }

  // Accuracy Trend Chart (Past 10 sessions in chronological order)
  const accuracyTrend: AccuracyTrendPoint[] = sessions
    .slice(0, 10)
    .reverse()
    .map((s, idx) => ({
      sessionNumber: idx + 1,
      gameTitle: s.gameTitle,
      accuracy: s.accuracy,
      score: s.score,
      date: s.completedAt.split('T')[0],
    }));

  // Game Performance Distribution
  const gameIds: CognitiveGameId[] = ['memory-match', 'remember-objects', 'sequence-memory'];
  const gamePerformance: GamePerformanceDistribution[] = gameIds.map(gId => {
    const matching = sessions.filter(s => s.gameId === gId);
    const count = matching.length;
    const avgScore = count > 0 ? Math.round(matching.reduce((a, b) => a + b.score, 0) / count) : 0;
    const avgAcc = count > 0 ? Math.round(matching.reduce((a, b) => a + b.accuracy, 0) / count) : 0;
    const adaptive = calculateAdaptiveDifficulty(gId, sessions);

    return {
      gameId: gId,
      gameTitle: formatGameTitle(gId),
      sessionsCount: count,
      avgScore,
      avgAccuracy: avgAcc,
      currentDifficulty: adaptive.difficulty,
    };
  });

  // Adaptive Difficulties Map
  const adaptiveDifficulties: PatientAnalyticsSummary['adaptiveDifficulties'] = {
    'memory-match': calculateAdaptiveDifficulty('memory-match', sessions),
    'remember-objects': calculateAdaptiveDifficulty('remember-objects', sessions),
    'sequence-memory': calculateAdaptiveDifficulty('sequence-memory', sessions),
  };

  // Generate Non-Medical Engagement Alerts
  const alerts = generateCaregiverAlerts(sessions, plans);

  return {
    elderlyProfile: elderly,
    totalGames,
    gamesThisWeek,
    averageScore,
    averageAccuracy,
    averageReactionTimeMs,
    averageDurationSeconds,
    averageAttempts,
    currentStreak,
    activeToday,
    todayGamesCount,
    weeklyActivity,
    accuracyTrend,
    gamePerformance,
    recentSessions: sessions.slice(0, 10),
    dailyPlans: plans,
    alerts,
    adaptiveDifficulties,
  };
};

const calculateStreakFromSessions = (sessions: GameResult[]): number => {
  if (sessions.length === 0) return 1;
  const uniqueDays = Array.from(new Set(sessions.map(s => s.completedAt.split('T')[0]))).sort().reverse();
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (uniqueDays.includes(dateStr)) {
      streak++;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }
  return Math.max(streak, 1);
};

const formatGameTitle = (gameType: string): string => {
  switch (gameType) {
    case 'memory-match':
      return 'Memory Match';
    case 'remember-objects':
      return 'Remember the Objects';
    case 'sequence-memory':
      return 'Sequence Memory';
    default:
      return 'Cognitive Game';
  }
};
