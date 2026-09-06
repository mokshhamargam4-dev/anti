import { CognitiveGameId, GameDifficulty, GameResult } from '../types/games';

export interface AdaptiveThresholds {
  promotionAccuracy: number; // e.g. 85%
  promotionScore: number;    // e.g. 85
  demotionAccuracy: number;  // e.g. 60%
  demotionScore: number;     // e.g. 60
  minSessionsRequired: number; // 3 sessions evaluated
  safeDefaultDifficulty: GameDifficulty; // 'easy'
}

// Configurable adaptive parameters
export const ADAPTIVE_CONFIG: AdaptiveThresholds = {
  promotionAccuracy: 85,
  promotionScore: 85,
  demotionAccuracy: 60,
  demotionScore: 60,
  minSessionsRequired: 3,
  safeDefaultDifficulty: 'easy',
};

// Non-medical clinical disclaimer as required by ethics and guidelines
export const NON_MEDICAL_DISCLAIMER =
  'Activity levels adapt gently to daily comfort and focus. Pacing adjustments reflect personal comfort and engagement, and do NOT constitute a medical or clinical diagnosis.';

export interface AdaptiveDecision {
  difficulty: GameDifficulty;
  reason: string;
  evaluatedSessionsCount: number;
  avgAccuracy: number;
  avgScore: number;
  isAdapted: boolean;
}

/**
 * Evaluates the last 3 sessions for a specific game and determines the adaptive difficulty.
 */
export const calculateAdaptiveDifficulty = (
  gameId: CognitiveGameId,
  allSessions: GameResult[],
  config: AdaptiveThresholds = ADAPTIVE_CONFIG
): AdaptiveDecision => {
  // Filter sessions strictly for this game and take the last N sessions
  const gameSessions = allSessions
    .filter(s => s.gameId === gameId)
    .slice(0, config.minSessionsRequired);

  // 1. Insufficient history -> safe default
  if (gameSessions.length < config.minSessionsRequired) {
    return {
      difficulty: config.safeDefaultDifficulty,
      reason: `Gentle starting pace (Safe default: completed ${gameSessions.length}/${config.minSessionsRequired} baseline sessions).`,
      evaluatedSessionsCount: gameSessions.length,
      avgAccuracy: 0,
      avgScore: 0,
      isAdapted: false,
    };
  }

  // Calculate averages over recent 3 sessions
  const totalAccuracy = gameSessions.reduce((acc, s) => acc + s.accuracy, 0);
  const totalScore = gameSessions.reduce((acc, s) => acc + s.score, 0);
  const avgAccuracy = Math.round(totalAccuracy / gameSessions.length);
  const avgScore = Math.round(totalScore / gameSessions.length);

  // Determine current baseline difficulty (from the most recent session)
  const currentDiff = gameSessions[0].difficulty;

  // 2. Strong performance -> promote
  if (avgAccuracy >= config.promotionAccuracy && avgScore >= config.promotionScore) {
    if (currentDiff === 'easy') {
      return {
        difficulty: 'medium',
        reason: `Excellent recent accuracy (${avgAccuracy}%) over 3 sessions! Elevated to Medium.`,
        evaluatedSessionsCount: gameSessions.length,
        avgAccuracy,
        avgScore,
        isAdapted: true,
      };
    }
    if (currentDiff === 'medium') {
      return {
        difficulty: 'hard',
        reason: `Consistent mastery (${avgAccuracy}% accuracy)! Elevated to Challenging.`,
        evaluatedSessionsCount: gameSessions.length,
        avgAccuracy,
        avgScore,
        isAdapted: true,
      };
    }
    return {
      difficulty: 'hard',
      reason: `Peak performance (${avgAccuracy}% accuracy). Continuing at Challenging level.`,
      evaluatedSessionsCount: gameSessions.length,
      avgAccuracy,
      avgScore,
      isAdapted: true,
    };
  }

  // 3. Weak performance -> demote for comfort
  if (avgAccuracy <= config.demotionAccuracy || avgScore <= config.demotionScore) {
    if (currentDiff === 'hard') {
      return {
        difficulty: 'medium',
        reason: `Gentle adjustment to Medium for smoother comfort (${avgAccuracy}% accuracy).`,
        evaluatedSessionsCount: gameSessions.length,
        avgAccuracy,
        avgScore,
        isAdapted: true,
      };
    }
    if (currentDiff === 'medium') {
      return {
        difficulty: 'easy',
        reason: `Gentle adjustment to Easy to ensure stress-free practice (${avgAccuracy}% accuracy).`,
        evaluatedSessionsCount: gameSessions.length,
        avgAccuracy,
        avgScore,
        isAdapted: true,
      };
    }
    return {
      difficulty: 'easy',
      reason: `Keeping comfortable Easy pace for relaxed memory stimulation.`,
      evaluatedSessionsCount: gameSessions.length,
      avgAccuracy,
      avgScore,
      isAdapted: true,
    };
  }

  // 4. Stable performance -> maintain
  return {
    difficulty: currentDiff,
    reason: `Steady, balanced focus (${avgAccuracy}% accuracy). Keeping ${currentDiff} level.`,
    evaluatedSessionsCount: gameSessions.length,
    avgAccuracy,
    avgScore,
    isAdapted: true,
  };
};

/**
 * Concrete gameplay configurations parameterized by difficulty
 */
export const GAME_ADAPTIVE_PARAMS = {
  'memory-match': {
    easy: { pairs: 3, label: '3 Pairs (6 Cards)', gridClass: 'grid-cols-2 sm:grid-cols-3' },
    medium: { pairs: 6, label: '6 Pairs (12 Cards)', gridClass: 'grid-cols-3 sm:grid-cols-4' },
    hard: { pairs: 8, label: '8 Pairs (16 Cards)', gridClass: 'grid-cols-4' },
  },
  'remember-objects': {
    easy: { count: 3, viewingSeconds: 10, poolSize: 6, label: '3 Objects (10s viewing)' },
    medium: { count: 5, viewingSeconds: 12, poolSize: 9, label: '5 Objects (12s viewing)' },
    hard: { count: 7, viewingSeconds: 15, poolSize: 12, label: '7 Objects (15s viewing)' },
  },
  'sequence-memory': {
    easy: { length: 3, displayIntervalMs: 1100, label: '3 Steps (Gentle pace)' },
    medium: { length: 4, displayIntervalMs: 900, label: '4 Steps (Standard pace)' },
    hard: { length: 5, displayIntervalMs: 750, label: '5 Steps (Fast pace)' },
  },
};

export const getEncouragingMessage = (accuracy: number, difficulty: string): string => {
  if (accuracy >= 90) {
    return 'Shabash! Excellent focus today! Your mind is bright, calm, and sharp.';
  }
  if (accuracy >= 70) {
    return 'Wonderful effort! Taking your time keeps the brain active and healthy.';
  }
  if (difficulty === 'hard') {
    return 'Great dedication! Challenging yourself is wonderful exercise for memory.';
  }
  return 'Good job completing the exercise! Every practice session brings peace and clarity.';
};

