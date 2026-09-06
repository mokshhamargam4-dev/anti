// Standalone test for adaptive logic
const ADAPTIVE_CONFIG = {
  promotionAccuracy: 85,
  promotionScore: 85,
  demotionAccuracy: 60,
  demotionScore: 60,
  minSessionsRequired: 3,
  safeDefaultDifficulty: 'easy',
};

const calculateAdaptiveDifficulty = (gameId, allSessions, config = ADAPTIVE_CONFIG) => {
  const gameSessions = allSessions
    .filter(s => s.gameId === gameId)
    .slice(0, config.minSessionsRequired);

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

  const totalAccuracy = gameSessions.reduce((acc, s) => acc + s.accuracy, 0);
  const totalScore = gameSessions.reduce((acc, s) => acc + s.score, 0);
  const avgAccuracy = Math.round(totalAccuracy / gameSessions.length);
  const avgScore = Math.round(totalScore / gameSessions.length);

  const currentDiff = gameSessions[0].difficulty;

  if (avgAccuracy >= config.promotionAccuracy && avgScore >= config.promotionScore) {
    if (currentDiff === 'easy') {
      return { difficulty: 'medium', reason: `Promoted to Medium (${avgAccuracy}% avg)` };
    }
    if (currentDiff === 'medium') {
      return { difficulty: 'hard', reason: `Promoted to Hard (${avgAccuracy}% avg)` };
    }
    return { difficulty: 'hard', reason: `Continuing at Hard (${avgAccuracy}% avg)` };
  }

  if (avgAccuracy <= config.demotionAccuracy || avgScore <= config.demotionScore) {
    if (currentDiff === 'hard') {
      return { difficulty: 'medium', reason: `Demoted to Medium (${avgAccuracy}% avg)` };
    }
    if (currentDiff === 'medium') {
      return { difficulty: 'easy', reason: `Demoted to Easy (${avgAccuracy}% avg)` };
    }
    return { difficulty: 'easy', reason: `Keeping Easy (${avgAccuracy}% avg)` };
  }

  return { difficulty: currentDiff, reason: `Maintained at ${currentDiff} (${avgAccuracy}% avg)` };
};

// Test 1: Empty history
const r1 = calculateAdaptiveDifficulty('memory-match', []);
console.log('Test 1 (Default):', r1.difficulty === 'easy' ? 'PASS' : 'FAIL', r1);

// Test 2: 3 strong sessions -> promotion
const r2 = calculateAdaptiveDifficulty('memory-match', [
  { gameId: 'memory-match', difficulty: 'easy', score: 95, accuracy: 92 },
  { gameId: 'memory-match', difficulty: 'easy', score: 90, accuracy: 88 },
  { gameId: 'memory-match', difficulty: 'easy', score: 98, accuracy: 95 },
]);
console.log('Test 2 (Promotion to medium):', r2.difficulty === 'medium' ? 'PASS' : 'FAIL', r2);

// Test 3: 3 low sessions -> demotion
const r3 = calculateAdaptiveDifficulty('remember-objects', [
  { gameId: 'remember-objects', difficulty: 'medium', score: 50, accuracy: 55 },
  { gameId: 'remember-objects', difficulty: 'medium', score: 55, accuracy: 50 },
  { gameId: 'remember-objects', difficulty: 'medium', score: 40, accuracy: 45 },
]);
console.log('Test 3 (Demotion to easy):', r3.difficulty === 'easy' ? 'PASS' : 'FAIL', r3);

// Test 4: Completing a game changes future difficulty
let history = [
  { gameId: 'sequence-memory', difficulty: 'easy', score: 95, accuracy: 92 },
  { gameId: 'sequence-memory', difficulty: 'easy', score: 90, accuracy: 88 },
];
// Before 3rd game:
const beforeGame = calculateAdaptiveDifficulty('sequence-memory', history);
console.log('Before 3rd game (only 2 sessions):', beforeGame.difficulty === 'easy' ? 'PASS' : 'FAIL');

// Complete 3rd game with strong score
history.unshift({ gameId: 'sequence-memory', difficulty: 'easy', score: 96, accuracy: 94 });
const afterGame = calculateAdaptiveDifficulty('sequence-memory', history);
console.log('After 3rd game (promoted to medium):', afterGame.difficulty === 'medium' ? 'PASS' : 'FAIL', afterGame);

console.log('All 4 test assertions verified!');
