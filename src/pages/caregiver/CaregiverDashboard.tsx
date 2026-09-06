import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchLinkedPatients,
  fetchPatientFullAnalytics,
  LinkedPatientInfo,
  PatientAnalyticsSummary
} from '../../services/caregiverService';
import { WeeklyActivityChart, AccuracyTrendChart, GamePerformanceChart } from '../../components/caregiver/CaregiverCharts';
import { CaregiverAlertsBanner } from '../../components/caregiver/CaregiverAlertsBanner';
import {
  Users,
  Activity,
  Brain,
  Clock,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Award,
  ShieldCheck,
  Target,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Layers,
  PhoneCall,
  History
} from 'lucide-react';

export const CaregiverDashboard: React.FC = () => {
  const { user, profile } = useAuth();

  const [linkedPatients, setLinkedPatients] = useState<LinkedPatientInfo[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<PatientAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // 1. Fetch linked elderly patients from Supabase
  const loadPatients = async () => {
    setLoading(true);
    const patients = await fetchLinkedPatients(user?.id);
    setLinkedPatients(patients);

    if (patients.length > 0) {
      // Retain selection if exists, or pick the first
      const currentExists = patients.some(p => p.elderly.id === selectedPatientId);
      const activeId = currentExists && selectedPatientId ? selectedPatientId : patients[0].elderly.id;
      setSelectedPatientId(activeId);
      await loadAnalytics(patients.find(p => p.elderly.id === activeId)!.elderly);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPatients();
  }, [user]);

  // 2. Fetch full analytics for the selected elderly patient
  const loadAnalytics = async (elderlyProfile: LinkedPatientInfo['elderly']) => {
    setRefreshing(true);
    const data = await fetchPatientFullAnalytics(elderlyProfile);
    setAnalytics(data);
    setRefreshing(false);
  };

  const handlePatientSelect = async (patientId: string) => {
    setSelectedPatientId(patientId);
    const target = linkedPatients.find(p => p.elderly.id === patientId);
    if (target) {
      await loadAnalytics(target.elderly);
    }
  };

  const handleRefresh = async () => {
    const current = linkedPatients.find(p => p.elderly.id === selectedPatientId);
    if (current) {
      await loadAnalytics(current.elderly);
    }
  };

  const activePatientInfo = linkedPatients.find(p => p.elderly.id === selectedPatientId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. Header & Linked Patient Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900">
              Caregiver Supervision & Monitoring
            </span>
            <span className="text-xs text-slate-500 font-medium">SIH PS 26003</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 mt-1">
            Welcome, {profile?.full_name || 'Caregiver'}
          </h1>
          <p className="text-slate-600 text-sm">
            Live cognitive monitoring, engagement frequency, and daily routine oversight.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-blue-700 hover:bg-slate-50 shadow-sm transition disabled:opacity-50"
            title="Refresh live data from database"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Linked Patient Dropdown Switcher */}
          <div className="flex items-center space-x-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
            <Users className="w-5 h-5 text-blue-700 ml-2" />
            <div className="text-left">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Supervising Patient
              </span>
              <select
                value={selectedPatientId || ''}
                onChange={(e) => handlePatientSelect(e.target.value)}
                aria-label="Select Linked Patient"
                className="bg-transparent font-bold text-slate-800 text-sm focus:outline-none cursor-pointer pr-4"
              >
                {linkedPatients.map(lp => (
                  <option key={lp.elderly.id} value={lp.elderly.id}>
                    {lp.elderly.full_name} ({lp.relationship})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Immediate Overview: Patient Profile Hero Card */}
      {activePatientInfo && (
        <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-800/70 text-blue-200 mb-3 border border-blue-700/50">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Authorized Patient • {activePatientInfo.relationship}</span>
            </div>

            <h2 className="text-3xl font-extrabold">
              {activePatientInfo.elderly.full_name}
              {activePatientInfo.elderly.preferred_name && (
                <span className="text-xl text-blue-200 font-normal ml-2">
                  ("{activePatientInfo.elderly.preferred_name}")
                </span>
              )}
            </h2>

            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs sm:text-sm text-blue-200 font-medium">
              <span>📍 {activePatientInfo.elderly.region || 'Assam, North East'}</span>
              <span>•</span>
              <span>🗣 Primary Language: {activePatientInfo.elderly.primary_language || 'Assamese'}</span>
              <span>•</span>
              <span className="capitalize">
                🧠 Severity Level: <strong className="text-white">{activePatientInfo.elderly.dementia_stage || 'Mild'}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-blue-200 font-medium">Emergency Link</div>
              <div className="text-sm font-bold text-white">
                {activePatientInfo.elderly.emergency_contact_phone || '+91 98765 43210'}
              </div>
              <div className="text-[11px] text-blue-300">
                {activePatientInfo.elderly.emergency_contact_name || 'Primary Guardian'}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Non-Medical Engagement Alerts */}
      {analytics && <CaregiverAlertsBanner alerts={analytics.alerts} />}

      {/* 4. Core Metric Highlights (Overview Cards) */}
      {analytics && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Today's Activity */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Activity</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">
                {analytics.activeToday ? `${analytics.todayGamesCount} Done` : 'None Yet'}
              </div>
              <span
                className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-1.5 ${
                  analytics.activeToday
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {analytics.activeToday ? 'Practiced Today' : 'Awaiting Session'}
              </span>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${analytics.activeToday ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              <Activity className="w-6 h-6" />
            </div>
          </div>

          {/* Average Recall Accuracy */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Accuracy</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">
                {analytics.averageAccuracy}%
              </div>
              <span className="text-xs text-emerald-600 font-bold flex items-center mt-1.5">
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> Stable recall rate
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
          </div>

          {/* Reaction / Duration Time */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Reaction Time</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">
                {(analytics.averageReactionTimeMs / 1000).toFixed(1)}s
              </div>
              <span className="text-xs text-slate-500 font-medium mt-1.5 block">
                Session avg: {analytics.averageDurationSeconds}s
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Current Practice Streak */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Streak</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">
                {analytics.currentStreak} Days
              </div>
              <span className="text-xs text-blue-600 font-bold mt-1.5 block">
                {analytics.totalGames} Total Activities
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
          </div>

        </section>
      )}

      {/* 5. Adaptive Difficulty Calibration Status */}
      {analytics && (
        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-base mb-3">
            <Layers className="w-5 h-5 text-teal-700" />
            <span>Calibrated Adaptive Difficulty Settings</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(analytics.adaptiveDifficulties).map(([gameId, val]) => (
              <div
                key={gameId}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 capitalize">
                      {gameId.replace('-', ' ')}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize bg-teal-100 text-teal-800">
                      {val.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {val.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Visual Analytics Charts (Recharts) */}
      {analytics && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeeklyActivityChart data={analytics.weeklyActivity} />
          <AccuracyTrendChart data={analytics.accuracyTrend} />
        </section>
      )}

      {/* 7. Game Performance Distribution Across Exercises */}
      {analytics && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <GamePerformanceChart data={analytics.gamePerformance} />
          </div>

          {/* Daily Care Routine Progress */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-base mb-3">
                <Calendar className="w-5 h-5 text-blue-700" />
                <span>Today's Care Routine Tasks</span>
              </div>

              <div className="divide-y divide-slate-100">
                {analytics.dailyPlans.map(plan => (
                  <div key={plan.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center ${
                          plan.is_completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${plan.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {plan.title}
                        </div>
                        <div className="text-[11px] text-slate-400">{plan.scheduled_time || 'Daily'}</div>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        plan.is_completed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {plan.is_completed ? 'Done' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 8. Recent Game Performance Audit Table */}
      {analytics && (
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-base">
            <History className="w-5 h-5 text-purple-700" />
            <span>Recent Game Session Logs (Supabase Database Records)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Activity Name</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Reaction Time</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {analytics.recentSessions.map((session, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">{session.gameTitle}</td>
                    <td className="py-3 px-4 capitalize">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-semibold">
                        {session.difficulty}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-teal-800">{session.score} pts</td>
                    <td className="py-3 px-4 font-extrabold text-emerald-700">{session.accuracy}%</td>
                    <td className="py-3 px-4">{session.durationSeconds}s</td>
                    <td className="py-3 px-4">
                      {session.reactionTimeMs ? `${(session.reactionTimeMs / 1000).toFixed(1)}s` : '—'}
                    </td>
                    <td className="py-3 px-4">{session.attempts}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(session.completedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

    </div>
  );
};
