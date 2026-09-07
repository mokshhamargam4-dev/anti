import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, DailyPlan } from '../types/database';
import {
  GameResult,
  CognitiveGameId,
  GameDifficulty,
} from '../types/games';
import { calculateAdaptiveDifficulty } from './adaptiveDifficulty';
import {
  generateCaregiverAlerts,
  CaregiverAlert,
} from './caregiverAlerts';

export interface LinkedPatientInfo {
  linkId: string;
  relationship: string;
  status: string;
  elderly: Profile;
}

export interface WeeklyActivityPoint {
  day: string;
  date: string;
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
  adaptiveDifficulties: Record<
    CognitiveGameId,
    { difficulty: GameDifficulty; reason: string }
  >;
}

/**
 * Fetches all elderly patients linked to the caregiver
 * via caregiver_links.
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
          .filter((lp) => Boolean(lp.elderly));
      }
    } catch (err) {
      console.warn(
        'Could not query linked patients from Supabase:',
        err
      );
    }
  }

  return [];
};

/**
 * Links the currently logged-in caregiver to an elderly patient
 * using the patient's unique patient code.
 */
export const linkPatientByCode = async (
  patientCode: string,
  relationship: string
): Promise<{
  success: boolean;
  patientId?: string;
  error?: string;
}> => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase is not configured.',
    };
  }

  if (!patientCode.trim()) {
    return {
      success: false,
      error: 'Please enter a patient code.',
    };
  }

  if (!relationship.trim()) {
    return {
      success: false,
      error: 'Please select a relationship.',
    };
  }

  try {
    const { data, error } = await supabase.rpc(
      'link_patient_by_code',
      {
        p_patient_code: patientCode.trim().toUpperCase(),
        p_relationship: relationship,
      }
    );

    if (error) {
      console.error('Error linking patient:', error);

      return {
        success: false,
        error: error.message || 'Could not link patient.',
      };
    }

    return {
      success: true,
      patientId: data,
    };
  } catch (err) {
    console.error(
      'Unexpected error linking patient:',
      err
    );

    return {
      success: false,
      error: 'Something went wrong while linking the patient.',
    };
  }
};
export const addDailyCarePlan = async (
  elderlyId: string,
  caregiverId: string,
  title: string,
  description: string,
  planDate: string,
  scheduledTime: string,
  activityType: DailyPlan['activity_type']
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase is not configured.',
    };
  }

  if (!elderlyId || !caregiverId) {
    return {
      success: false,
      error: 'Patient or caregiver information is missing.',
    };
  }

  if (!title.trim()) {
    return {
      success: false,
      error: 'Please enter a task title.',
    };
  }

  try {
    const { error } = await supabase
      .from('daily_plans')
      .insert({
        elderly_id: elderlyId,
        title: title.trim(),
        description: description.trim() || null,
        plan_date: planDate,
        scheduled_time: scheduledTime || null,
        activity_type: activityType,
        is_completed: false,
        created_by: caregiverId,
      });

    if (error) {
      console.error('Error creating daily care plan:', error);

      return {
        success: false,
        error: error.message || 'Could not create care task.',
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error creating care plan:', err);

    return {
      success: false,
      error: 'Something went wrong while creating the task.',
    };
  }
};
/**
 * Loads complete real-time analytics for a linked elderly patient.
 */
export const fetchPatientFullAnalytics = async (
  elderly: Profile
): Promise<PatientAnalyticsSummary> => {
  let sessions: GameResult[] = [];
  let plans: DailyPlan[] = [];

  // ---------------------------------------------------------
  // 1. Fetch real game sessions and daily plans from Supabase
  // ---------------------------------------------------------
  if (isSupabaseConfigured()) {
    try {
      const { data: dbSessions, error: sessionsError } =
        await supabase
          .from('game_sessions')
          .select('*')
          .eq('elderly_id', elderly.id)
          .order('completed_at', { ascending: false })
          .limit(50);

      if (sessionsError) {
        console.warn(
          'Could not fetch game sessions:',
          sessionsError
        );
      }

      if (dbSessions && dbSessions.length > 0) {
        sessions = dbSessions.map((row: any) => ({
          gameId: row.game_type as CognitiveGameId,
          gameTitle: formatGameTitle(row.game_type),
          difficulty: row.difficulty_level,
          score: Number(row.score) || 0,
          maxScore: Number(row.max_score) || 100,
          accuracy: Number(row.accuracy_rate) || 0,
          durationSeconds: Number(row.duration_seconds) || 0,
          reactionTimeMs:
            typeof row.metrics?.reaction_time_ms === 'number'
              ? row.metrics.reaction_time_ms
              : undefined,
          attempts: Number(row.metrics?.attempts) || 1,
          completedAt:
            row.completed_at || row.created_at,
          encouragingFeedback:
            'Session recorded in database',
          adaptiveReason:
            row.metrics?.adaptive_reason,
        }));
      }

      const { data: dbPlans, error: plansError } =
        await supabase
          .from('daily_plans')
          .select('*')
          .eq('elderly_id', elderly.id)
          .order('scheduled_time', {
            ascending: true,
          });

      if (plansError) {
        console.warn(
          'Could not fetch daily plans:',
          plansError
        );
      }

      if (dbPlans && dbPlans.length > 0) {
        plans = dbPlans as DailyPlan[];
      }
    } catch (err) {
      console.warn(
        'Error querying patient database analytics:',
        err
      );
    }
  }

  // ---------------------------------------------------------
  // 2. Calculate aggregates from REAL sessions only
  // ---------------------------------------------------------
  const totalGames = sessions.length;

  const now = new Date();

  const past7Days = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000
  );

  const gamesThisWeek = sessions.filter(
    (session) =>
      new Date(session.completedAt) >= past7Days
  ).length;

  const averageScore =
    totalGames > 0
      ? Math.round(
          sessions.reduce(
            (total, session) =>
              total + session.score,
            0
          ) / totalGames
        )
      : 0;

  const averageAccuracy =
    totalGames > 0
      ? Math.round(
          sessions.reduce(
            (total, session) =>
              total + session.accuracy,
            0
          ) / totalGames
        )
      : 0;

  const averageDurationSeconds =
    totalGames > 0
      ? Math.round(
          sessions.reduce(
            (total, session) =>
              total + session.durationSeconds,
            0
          ) / totalGames
        )
      : 0;

  const averageAttempts =
    totalGames > 0
      ? Math.round(
          (sessions.reduce(
            (total, session) =>
              total + session.attempts,
            0
          ) /
            totalGames) *
            10
        ) / 10
      : 0;

  const reactionTimes = sessions
    .map((session) => session.reactionTimeMs)
    .filter(
      (time): time is number =>
        typeof time === 'number'
    );

  const averageReactionTimeMs =
    reactionTimes.length > 0
      ? Math.round(
          reactionTimes.reduce(
            (total, time) => total + time,
            0
          ) / reactionTimes.length
        )
      : 0;

  // ---------------------------------------------------------
  // 3. Today's activity
  // ---------------------------------------------------------
  const todayStr = getLocalDateString();

  const todaySessions = sessions.filter(
    (session) =>
      getLocalDateString(
        new Date(session.completedAt)
      ) === todayStr
  );

  const activeToday = todaySessions.length > 0;

  const todayGamesCount = todaySessions.length;

  const currentStreak =
    calculateStreakFromSessions(sessions);

  // ---------------------------------------------------------
  // 4. Weekly Activity Chart - REAL DATA
  // ---------------------------------------------------------
  const weeklyActivity: WeeklyActivityPoint[] = [];

  const dayNames = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);

    date.setDate(now.getDate() - i);

    const dateStr = getLocalDateString(date);

    const daySessions = sessions.filter(
      (session) =>
        getLocalDateString(
          new Date(session.completedAt)
        ) === dateStr
    );

    const minutes = Math.round(
      daySessions.reduce(
        (total, session) =>
          total + session.durationSeconds,
        0
      ) / 60
    );

    weeklyActivity.push({
      day: dayNames[date.getDay()],
      date: dateStr,
      games: daySessions.length,
      minutes,
    });
  }

  // ---------------------------------------------------------
  // 5. Accuracy Trend - LAST 10 REAL SESSIONS
  // ---------------------------------------------------------
  const accuracyTrend: AccuracyTrendPoint[] =
    sessions
      .slice(0, 10)
      .reverse()
      .map((session, index) => ({
        sessionNumber: index + 1,
        gameTitle: session.gameTitle,
        accuracy: session.accuracy,
        score: session.score,
        date: getLocalDateString(
          new Date(session.completedAt)
        ),
      }));

  // ---------------------------------------------------------
  // 6. Game Performance Distribution
  // ---------------------------------------------------------
  const gameIds: CognitiveGameId[] = [
    'memory-match',
    'remember-objects',
    'sequence-memory',
  ];

  const gamePerformance: GamePerformanceDistribution[] =
    gameIds.map((gameId) => {
      const matchingSessions = sessions.filter(
        (session) => session.gameId === gameId
      );

      const count = matchingSessions.length;

      const avgScore =
        count > 0
          ? Math.round(
              matchingSessions.reduce(
                (total, session) =>
                  total + session.score,
                0
              ) / count
            )
          : 0;

      const avgAccuracy =
        count > 0
          ? Math.round(
              matchingSessions.reduce(
                (total, session) =>
                  total + session.accuracy,
                0
              ) / count
            )
          : 0;

      const adaptive =
        calculateAdaptiveDifficulty(
          gameId,
          sessions
        );

      return {
        gameId,
        gameTitle: formatGameTitle(gameId),
        sessionsCount: count,
        avgScore,
        avgAccuracy,
        currentDifficulty: adaptive.difficulty,
      };
    });

  // ---------------------------------------------------------
  // 7. Adaptive Difficulty
  // ---------------------------------------------------------
  const adaptiveDifficulties: PatientAnalyticsSummary['adaptiveDifficulties'] =
    {
      'memory-match':
        calculateAdaptiveDifficulty(
          'memory-match',
          sessions
        ),

      'remember-objects':
        calculateAdaptiveDifficulty(
          'remember-objects',
          sessions
        ),

      'sequence-memory':
        calculateAdaptiveDifficulty(
          'sequence-memory',
          sessions
        ),
    };

  // ---------------------------------------------------------
  // 8. Non-medical caregiver engagement alerts
  // ---------------------------------------------------------
  const alerts = generateCaregiverAlerts(
    sessions,
    plans
  );

  // ---------------------------------------------------------
  // 9. Return complete analytics
  // ---------------------------------------------------------
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

/**
 * Calculates the current consecutive-day activity streak.
 *
 * Important:
 * - 0 games = 0 streak
 * - If there is no activity today, the current streak is 0
 * - Otherwise count consecutive active days backwards
 */
const calculateStreakFromSessions = (
  sessions: GameResult[]
): number => {
  if (sessions.length === 0) {
    return 0;
  }

  const uniqueDays = Array.from(
    new Set(
      sessions.map((session) =>
        getLocalDateString(
          new Date(session.completedAt)
        )
      )
    )
  ).sort();

  const today = new Date();

  const todayStr = getLocalDateString(today);

  // A current streak should include today.
  if (!uniqueDays.includes(todayStr)) {
    return 0;
  }

  let streak = 0;

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);

    date.setDate(today.getDate() - i);

    const dateStr = getLocalDateString(date);

    if (uniqueDays.includes(dateStr)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Returns a local YYYY-MM-DD date.
 * This avoids UTC date shifting from toISOString().
 */
const getLocalDateString = (
  date: Date = new Date()
): string => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Converts database game IDs into display titles.
 */
const formatGameTitle = (
  gameType: string
): string => {
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
