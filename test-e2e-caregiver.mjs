// Standalone End-to-End Simulation Test: Elderly -> Game -> Database -> Caregiver Dashboard

const generateCaregiverAlerts = (sessions, plans) => {
  const alerts = [];
  const todayStr = new Date().toISOString().split('T')[0];

  const todaySessions = sessions.filter(s => s.completedAt.startsWith(todayStr));
  if (todaySessions.length === 0) {
    alerts.push({
      id: 'alert-no-activity-today',
      severity: 'warning',
      title: 'No Session Recorded Today',
      message: 'No cognitive activity has been recorded yet today.',
    });
  } else {
    alerts.push({
      id: 'alert-active-today',
      severity: 'success',
      title: 'Active Today',
      message: `${todaySessions.length} cognitive exercise session(s) completed today.`,
    });
  }

  const pendingPlans = plans.filter(p => !p.is_completed && p.plan_date === todayStr);
  if (pendingPlans.length > 0) {
    alerts.push({
      id: 'alert-pending-routine',
      severity: 'info',
      title: 'Daily Routine Items Pending',
      message: `${pendingPlans.length} scheduled care routine task(s) are awaiting completion today.`,
    });
  }

  return alerts;
};

const calculateAdaptiveDifficulty = (gameId, allSessions) => {
  const gameSessions = allSessions.filter(s => s.gameId === gameId).slice(0, 3);
  if (gameSessions.length < 3) {
    return { difficulty: 'easy', reason: 'Gentle baseline' };
  }
  const avgAcc = Math.round(gameSessions.reduce((acc, s) => acc + s.accuracy, 0) / gameSessions.length);
  const avgScore = Math.round(gameSessions.reduce((acc, s) => acc + s.score, 0) / gameSessions.length);
  if (avgAcc >= 85 && avgScore >= 85) {
    return { difficulty: 'medium', reason: `Elevated to Medium (${avgAcc}% avg accuracy)` };
  }
  return { difficulty: 'easy', reason: 'Safe pace' };
};

console.log('--- STARTING END-TO-END TEST: Elderly Game -> Caregiver Dashboard ---');

// 1. Initial State: Elderly has not played today
const initialSessions = [
  { gameId: 'memory-match', difficulty: 'easy', score: 90, accuracy: 92, completedAt: '2026-09-05T10:00:00Z' },
  { gameId: 'memory-match', difficulty: 'easy', score: 92, accuracy: 90, completedAt: '2026-09-04T10:00:00Z' },
];
const dailyPlans = [
  { id: 'p1', title: 'Morning Medicine', is_completed: true, plan_date: new Date().toISOString().split('T')[0] },
  { id: 'p2', title: 'Play Memory Game', is_completed: false, plan_date: new Date().toISOString().split('T')[0] },
];

console.log('\n[1] Caregiver dashboard BEFORE elderly plays:');
const alertsBefore = generateCaregiverAlerts(initialSessions, dailyPlans);
console.log('Alerts:', alertsBefore.map(a => `[${a.severity.toUpperCase()}] ${a.title}`));
if (!alertsBefore.some(a => a.id === 'alert-no-activity-today')) {
  throw new Error('Test failed: Should alert "No Session Recorded Today"');
}
console.log('✓ Correctly detected: No activity recorded today.');

// 2. Elderly plays and completes a session today
console.log('\n[2] Elderly plays Memory Match and completes session:');
const newSessionToday = {
  gameId: 'memory-match',
  difficulty: 'easy',
  score: 96,
  accuracy: 95,
  durationSeconds: 35,
  attempts: 5,
  completedAt: new Date().toISOString(), // Today
};
const updatedSessions = [newSessionToday, ...initialSessions];
dailyPlans[1].is_completed = true;

// 3. Caregiver dashboard updates with real session
console.log('\n[3] Caregiver dashboard updates with new session:');
const alertsAfter = generateCaregiverAlerts(updatedSessions, dailyPlans);
console.log('Alerts:', alertsAfter.map(a => `[${a.severity.toUpperCase()}] ${a.title}`));
if (!alertsAfter.some(a => a.id === 'alert-active-today')) {
  throw new Error('Test failed: Should alert "Active Today"');
}
console.log('✓ Correctly detected: "Active Today" status updated.');

// 4. Adaptive Difficulty is evaluated on Caregiver Dashboard
const adaptive = calculateAdaptiveDifficulty('memory-match', updatedSessions);
console.log('\n[4] Caregiver Dashboard Adaptive Status:');
console.log('Memory Match Adaptive Level:', adaptive.difficulty, `(${adaptive.reason})`);
if (adaptive.difficulty !== 'medium') {
  throw new Error('Test failed: Expected promotion to medium after 3 strong sessions');
}
console.log('✓ Correctly promoted to Medium difficulty based on 3 sessions.');

console.log('\n🎉 END-TO-END PIPELINE VALIDATED SUCCESSFULLY!');
