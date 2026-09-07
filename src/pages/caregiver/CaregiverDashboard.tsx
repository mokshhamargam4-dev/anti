import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DailyPlan } from '../../types/database';
import {
  fetchLinkedPatients,
  fetchPatientFullAnalytics,
  linkPatientByCode,
  LinkedPatientInfo,
  PatientAnalyticsSummary,
  addDailyCarePlan
} from '../../services/caregiverService';
import { supabase } from '../../lib/supabase';
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
const [taskTitle, setTaskTitle] = useState('');
const [taskDescription, setTaskDescription] = useState('');
const [taskTime, setTaskTime] = useState('');
const [taskType, setTaskType] =
  useState<DailyPlan['activity_type']>('routine');
const [taskSaving, setTaskSaving] = useState(false);
const [taskMessage, setTaskMessage] = useState('');
  const [patientCode, setPatientCode] = useState('');
  const [relationship, setRelationship] = useState('Family');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');
  const [memoryTitle, setMemoryTitle] = useState('');
const [memoryDescription, setMemoryDescription] = useState('');
const [memoryType, setMemoryType] = useState('event');
const [memoryTag, setMemoryTag] = useState('');
const [memorySaving, setMemorySaving] = useState(false);
const [memorySuccess, setMemorySuccess] = useState('');
const [memoryError, setMemoryError] = useState('');

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
const handleLinkPatient = async () => {
  setLinkError('');
  setLinkSuccess('');

  if (!patientCode.trim()) {
    setLinkError('Please enter the patient code.');
    return;
  }

  setLinking(true);

  const result = await linkPatientByCode(
    patientCode.trim(),
    relationship
  );

  if (!result.success) {
    setLinkError(result.error || 'Could not link patient.');
    setLinking(false);
    return;
  }

  setLinkSuccess('Patient linked successfully!');
  setPatientCode('');

  // Reload linked patients
  const patients = await fetchLinkedPatients(user?.id);
  setLinkedPatients(patients);

  if (result.patientId) {
    setSelectedPatientId(result.patientId);

    const linkedPatient = patients.find(
      p => p.elderly.id === result.patientId
    );

    if (linkedPatient) {
      await loadAnalytics(linkedPatient.elderly);
    }
  }

  setLinking(false);
};
const handleAddMemory = async () => {
  setMemoryError('');
  setMemorySuccess('');

  if (!selectedPatientId) {
    setMemoryError('Please select a patient first.');
    return;
  }

  if (!memoryTitle.trim()) {
    setMemoryError('Please enter a memory title.');
    return;
  }

  setMemorySaving(true);

  const { error } = await supabase
    .from('memory_items')
    .insert({
      elderly_id: selectedPatientId,
      title: memoryTitle.trim(),
      description: memoryDescription.trim() || null,
      item_type: memoryType,
      cultural_tag: memoryTag.trim() || null,
      created_by: user?.id || null,
    });

  if (error) {
    setMemoryError(error.message);
  } else {
    setMemorySuccess('Memory added successfully!');
    setMemoryTitle('');
    setMemoryDescription('');
    setMemoryTag('');
  }

  setMemorySaving(false);
};
  const handleRefresh = async () => {
    const current = linkedPatients.find(p => p.elderly.id === selectedPatientId);
    if (current) {
      await loadAnalytics(current.elderly);
    }
  };
const handleAddCareTask = async () => {
  if (!selectedPatientId || !user?.id) {
    setTaskMessage('Please select a patient first.');
    return;
  }

  if (!taskTitle.trim()) {
    setTaskMessage('Please enter a task title.');
    return;
  }

  setTaskSaving(true);
  setTaskMessage('');

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const result = await addDailyCarePlan(
    selectedPatientId,
    user.id,
    taskTitle,
    taskDescription,
    todayStr,
    taskTime,
    taskType
  );

  if (!result.success) {
    setTaskMessage(result.error || 'Could not add care task.');
    setTaskSaving(false);
    return;
  }

  setTaskTitle('');
  setTaskDescription('');
  setTaskTime('');
  setTaskType('routine');
  setTaskMessage('Care task added successfully!');

  // Refresh caregiver dashboard so the new task appears
  const selectedPatient = linkedPatients.find(
  (patient) => patient.elderly.id === selectedPatientId
);

if (selectedPatient) {
  await loadAnalytics(selectedPatient.elderly);
}

  setTaskSaving(false);
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
{/* Link Patient */}
<section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
  <div className="flex items-center gap-2 mb-4">
    <Users className="w-5 h-5 text-blue-700" />
    <div>
      <h2 className="font-bold text-slate-800">Link a Patient</h2>
      <p className="text-xs text-slate-500">
        Enter the patient's unique SmritiSetu code.
      </p>
    </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
    <input
      type="text"
      value={patientCode}
      onChange={(e) => setPatientCode(e.target.value)}
      placeholder="Patient Code e.g. SS-A1B2C3"
      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />

    <select
      value={relationship}
      onChange={(e) => setRelationship(e.target.value)}
      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="Family">Family</option>
      <option value="Mother">Mother</option>
      <option value="Father">Father</option>
      <option value="Spouse">Spouse</option>
      <option value="Son">Son</option>
      <option value="Daughter">Daughter</option>
      <option value="Guardian">Guardian</option>
      <option value="Clinical Caregiver">Clinical Caregiver</option>
      <option value="Other">Other</option>
    </select>

    <button
      type="button"
      onClick={handleLinkPatient}
      disabled={linking}
      className="px-5 py-3 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800 transition disabled:opacity-50"
    >
      {linking ? 'Linking...' : 'Link Patient'}
    </button>
  </div>

  {linkError && (
    <p className="mt-3 text-sm font-semibold text-red-600">
      {linkError}
    </p>
  )}

  {linkSuccess && (
    <p className="mt-3 text-sm font-semibold text-emerald-600">
      {linkSuccess}
    </p>
  )}
</section>
{/* Add Memory */}
{activePatientInfo && (
  <section className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm">
    <div className="flex items-center gap-2 mb-4">
      <Brain className="w-5 h-5 text-amber-700" />
      <div>
        <h2 className="font-bold text-slate-800">Add a Memory</h2>
        <p className="text-xs text-slate-500">
          Save a meaningful memory for {activePatientInfo.elderly.full_name}.
        </p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <input
        type="text"
        value={memoryTitle}
        onChange={(e) => setMemoryTitle(e.target.value)}
        placeholder="Memory title"
        className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
      />

      <select
        value={memoryType}
        onChange={(e) => setMemoryType(e.target.value)}
        className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        <option value="person">Person</option>
        <option value="place">Place</option>
        <option value="event">Event</option>
        <option value="song_rhyme">Song / Rhyme</option>
        <option value="cultural_artifact">Cultural Artifact</option>
      </select>

      <textarea
        value={memoryDescription}
        onChange={(e) => setMemoryDescription(e.target.value)}
        placeholder="Describe this memory..."
        rows={3}
        className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 md:col-span-2"
      />

      <input
        type="text"
        value={memoryTag}
        onChange={(e) => setMemoryTag(e.target.value)}
        placeholder="Cultural tag (optional)"
        className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
      />

      <button
        type="button"
        onClick={handleAddMemory}
        disabled={memorySaving}
        className="px-5 py-3 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition disabled:opacity-50"
      >
        {memorySaving ? 'Saving...' : 'Save Memory'}
      </button>
    </div>

    {memoryError && (
      <p className="mt-3 text-sm font-semibold text-red-600">
        {memoryError}
      </p>
    )}

    {memorySuccess && (
      <p className="mt-3 text-sm font-semibold text-emerald-600">
        {memorySuccess}
      </p>
    )}
  </section>
)}
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
              <span className="text-xs text-slate-500 font-bold flex items-center mt-1.5">
  Based on completed games
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
{/* Add Daily Care Task */}
<div className="bg-white p-6 rounded-3xl border border-teal-200 shadow-sm mb-6">
  <div className="flex items-center space-x-2 mb-4">
    <Calendar className="w-5 h-5 text-teal-700" />
    <div>
      <h3 className="text-lg font-bold text-slate-800">
        Add Care Task
      </h3>
      <p className="text-sm text-slate-500">
        Create a task for today's care routine.
      </p>
    </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

    {/* Task title */}
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">
        Task
      </label>
      <input
        type="text"
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
        placeholder="Example: Morning walk"
        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
    </div>

    {/* Time */}
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">
        Time
      </label>
      <input
        type="time"
        value={taskTime}
        onChange={(e) => setTaskTime(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
    </div>

    {/* Description */}
    <div className="md:col-span-2">
      <label className="block text-sm font-semibold text-slate-700 mb-1">
        Description
      </label>
      <input
        type="text"
        value={taskDescription}
        onChange={(e) => setTaskDescription(e.target.value)}
        placeholder="Example: Take a gentle 15 minute walk"
        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
    </div>

    {/* Activity type */}
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">
        Activity Type
      </label>
      <select
        value={taskType}
        onChange={(e) =>
          setTaskType(e.target.value as DailyPlan['activity_type'])
        }
        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        <option value="routine">Routine</option>
        <option value="medication">Medication</option>
        <option value="walk">Walk</option>
        <option value="meal">Meal</option>
        <option value="family_call">Family Call</option>
        <option value="cultural_music">Cultural Music</option>
        <option value="cognitive_game">Cognitive Game</option>
      </select>
    </div>

    {/* Add button */}
    <div className="flex items-end">
      <button
        type="button"
        disabled={taskSaving || !selectedPatientId}
        onClick={handleAddCareTask}
        className="w-full px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {taskSaving ? 'Adding...' : '+ Add Care Task'}
      </button>
    </div>

  </div>

  {taskMessage && (
    <div className="mt-4 p-3 rounded-xl bg-teal-50 border border-teal-200 text-sm font-semibold text-teal-800">
      {taskMessage}
    </div>
  )}
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
