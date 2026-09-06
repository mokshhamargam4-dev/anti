import { GameResult } from '../types/games';
import { DailyPlan } from '../types/database';

export type AlertSeverity = 'info' | 'warning' | 'success';

export interface CaregiverAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  suggestion?: string;
  metric?: string;
  timestamp: string;
}

/**
 * Non-Medical Clinical Disclaimer:
 * The alerts generated herein are derived exclusively from session frequencies,
 * engagement duration, and routine task timestamps. They do NOT represent a
 * medical evaluation, clinical assessment, or dementia progression analysis.
 */
export const NON_MEDICAL_ALERT_DISCLAIMER =
  'Engagement notifications are based solely on activity frequency and routine completion. They do not constitute a medical diagnosis or clinical assessment.';

/**
 * Evaluates patient activity and produces strictly neutral, non-medical engagement alerts.
 */
export const generateCaregiverAlerts = (
  sessions: GameResult[],
  plans: DailyPlan[]
): CaregiverAlert[] => {
  const alerts: CaregiverAlert[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Alert: No Activity Recorded Today
  const todaySessions = sessions.filter(s => s.completedAt.startsWith(todayStr));
  if (todaySessions.length === 0) {
    alerts.push({
      id: 'alert-no-activity-today',
      severity: 'warning',
      title: 'No Session Recorded Today',
      message: 'No cognitive activity has been recorded yet today.',
      suggestion: 'You may want to gently invite your loved one to play a 5-minute Memory Match session.',
      timestamp: new Date().toISOString(),
    });
  } else {
    alerts.push({
      id: 'alert-active-today',
      severity: 'success',
      title: 'Active Today',
      message: `${todaySessions.length} cognitive exercise session(s) completed today.`,
      metric: `${todaySessions.length} session(s)`,
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Alert: Reduced Engagement Compared with Previous Week
  const now = new Date();
  const past7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const previous7to14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeekCount = sessions.filter(s => new Date(s.completedAt) >= past7Days).length;
  const lastWeekCount = sessions.filter(
    s => new Date(s.completedAt) >= previous7to14Days && new Date(s.completedAt) < past7Days
  ).length;

  if (lastWeekCount >= 3 && thisWeekCount < lastWeekCount * 0.7) {
    alerts.push({
      id: 'alert-reduced-weekly-engagement',
      severity: 'warning',
      title: 'Reduced Engagement This Week',
      message: `Game participation has decreased this week (${thisWeekCount} sessions this week vs ${lastWeekCount} sessions last week).`,
      suggestion: 'Consider checking in on their daily routine, fatigue, or mood comfort.',
      metric: `-${Math.round(((lastWeekCount - thisWeekCount) / lastWeekCount) * 100)}% vs last week`,
      timestamp: new Date().toISOString(),
    });
  }

  // 3. Alert: Scheduled Routine Tasks Pending
  const pendingPlans = plans.filter(p => !p.is_completed && p.plan_date === todayStr);
  if (pendingPlans.length > 0) {
    alerts.push({
      id: 'alert-pending-routine',
      severity: 'info',
      title: 'Daily Routine Items Pending',
      message: `${pendingPlans.length} scheduled care routine task(s) are awaiting completion today.`,
      suggestion: 'Review pending medications or walks in the care plan schedule.',
      metric: `${pendingPlans.length} pending`,
      timestamp: new Date().toISOString(),
    });
  }

  // 4. Alert: Consistent Practice Recognition
  const uniqueDates = Array.from(
    new Set(sessions.map(s => s.completedAt.split('T')[0]))
  );
  if (uniqueDates.length >= 3) {
    alerts.push({
      id: 'alert-consistent-practice',
      severity: 'success',
      title: 'Consistent Practice Recorded',
      message: 'Regular cognitive exercise habit maintained across recent days.',
      suggestion: 'Positive reinforcement helps support daily emotional reassurance.',
      timestamp: new Date().toISOString(),
    });
  }

  return alerts;
};
