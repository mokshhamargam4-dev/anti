import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

import { DailyPlan } from '../../types/database';
import { CognitiveGameId, CognitiveJourneyStats } from '../../types/games';
import { SimpleMood, PersonalizedDailyPlan } from '../../types/plan';
import { fetchUserGameHistory, calculateCognitiveJourney } from '../../services/gameSessionService';
import { NON_MEDICAL_DISCLAIMER } from '../../services/adaptiveDifficulty';
import { getTranslations } from '../../services/languageService';
import {
  generatePersonalizedPlan,
  saveMoodCheckin,
  getStoredMood,
  syncPersonalizedPlan,
  MOOD_DEFINITIONS,
  NON_MEDICAL_MOOD_DISCLAIMER
} from '../../services/personalizedPlanService';
import {
  Gamepad2,
  CalendarCheck,
  Smile,
  PhoneCall,
  CheckCircle2,
  Clock,
  Sparkles,
  Heart,
  ChevronRight,
  Flame,
  Award,
  Play,
  Brain,
  History,
  Target,
  Info,
  Calendar,
  Activity,
  Check,
  Copy,
  Lightbulb
} from 'lucide-react';

export const ElderlyDashboard: React.FC = () => {
  const { user, profile } = useAuth();

const navigate = useNavigate();

  const handleCopyPatientCode = async () => {
  if (!profile?.patient_code) return;

  try {
    await navigator.clipboard.writeText(profile.patient_code);
    alert('Patient code copied!');
  } catch {
    console.warn('Could not copy patient code');
  }
};
  

  const [currentTime, setCurrentTime] = useState(new Date());
interface MemoryItem {
  id: string;
  title: string;
  description?: string | null;
  item_type: string;
  cultural_tag?: string | null;
}

const [memories, setMemories] = useState<MemoryItem[]>([]);
const [isListening, setIsListening] = useState(false);
const [voiceLanguage, setVoiceLanguage] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [selectedMood, setSelectedMood] = useState<SimpleMood | null>(null);
  const [moodSubmitted, setMoodSubmitted] = useState<boolean>(false);
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([]);
  const[recognizedCommand, setRecognizedCommand] = useState('');
  const [journey, setJourney] = useState<CognitiveJourneyStats | null>(null);
  const [personalizedPlan, setPersonalizedPlan] = useState<PersonalizedDailyPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  function startVoice() {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert(
      'Voice recognition is not supported. Please use Google Chrome or Microsoft Edge.'
    );
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = voiceLanguage;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  setIsListening(true);
  setRecognizedCommand('');

  recognition.onstart = () => {
    console.log('🎙️ Voice recognition started');
  };

  recognition.onresult = (event: any) => {
    const command =
      event.results[0][0].transcript.toLowerCase().trim();

    console.log('🎤 Heard:', command);
    setRecognizedCommand(command);

    const speak = (message: string) => {
      const speech = new SpeechSynthesisUtterance(message);
      speech.lang = voiceLanguage;

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(speech);
    };

    // ==========================================
    // 1️⃣ MEMORY MATCH
    // ==========================================
    if (
      command.includes('memory match') ||
      command.includes('match game') ||
      command.includes('matching game') ||
      command.includes('मेमोरी मैच')
    ) {
      speak(
        voiceLanguage === 'hi-IN'
          ? 'मेमोरी मैच शुरू किया जा रहा है।'
          : 'Starting Memory Match.'
      );

      setTimeout(() => {
        navigate('/elderly/play/memory-match');
      }, 700);

      return;
    }

    // ==========================================
    // 2️⃣ REMEMBER THE OBJECTS
    // ==========================================
    if (
      command.includes('remember the objects') ||
      command.includes('remember objects') ||
      command.includes('objects game') ||
      command.includes('object game') ||
      command.includes('वस्तु') ||
      command.includes('चीजें')
    ) {
      speak(
        voiceLanguage === 'hi-IN'
          ? 'याद रखने वाली वस्तुओं का खेल शुरू किया जा रहा है।'
          : 'Starting Remember the Objects.'
      );

      setTimeout(() => {
        navigate('/elderly/play/remember-objects');
      }, 700);

      return;
    }

    // ==========================================
    // 3️⃣ SEQUENCE MEMORY
    // ==========================================
    if (
      command.includes('sequence memory') ||
      command.includes('sequence game') ||
      command.includes('memory sequence') ||
      command.includes('sequence') ||
      command.includes('अनुक्रम')
    ) {
      speak(
        voiceLanguage === 'hi-IN'
          ? 'सीक्वेंस मेमोरी शुरू किया जा रहा है।'
          : 'Starting Sequence Memory.'
      );

      setTimeout(() => {
        navigate('/elderly/play/sequence-memory');
      }, 700);

      return;
    }

    // ==========================================
    // 4️⃣ SMRITI PRACTICE
    // ==========================================
    if (
      command.includes('smriti') ||
      command.includes('smriti practice') ||
      command.includes('memory practice') ||
      command.includes('practice') ||
      command.includes('स्मृति') ||
      command.includes('अभ्यास')
    ) {
      speak(
        voiceLanguage === 'hi-IN'
          ? 'स्मृति अभ्यास शुरू किया जा रहा है।'
          : 'Starting Smriti Practice.'
      );

      setTimeout(() => {
        navigate('/elderly/smriti-practice');
      }, 700);

      return;
    }

    // ==========================================
    // 5️⃣ TODAY'S ROUTINE
    // ==========================================
    if (
      command.includes('routine') ||
      command.includes('my routine') ||
      command.includes('today routine') ||
      command.includes('daily routine') ||
      command.includes('schedule') ||
      command.includes('my tasks') ||
      command.includes('daily tasks') ||
      command.includes('दिनचर्या') ||
      command.includes('आज')
    ) {
      speak(
        voiceLanguage === 'hi-IN'
          ? 'यह आपकी आज की दिनचर्या है।'
          : 'Showing your routine for today.'
      );

      setTimeout(() => {
        document
          .getElementById('daily-routine')
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
      }, 500);

      return;
    }

    // ==========================================
    // UNKNOWN COMMAND
    // ==========================================
    speak(
      voiceLanguage === 'hi-IN'
        ? 'माफ कीजिए। आप मेमोरी मैच, ऑब्जेक्ट्स, सीक्वेंस, स्मृति अभ्यास या दिनचर्या कह सकते हैं।'
        : 'Sorry, I did not understand. You can say Memory Match, Remember the Objects, Sequence Memory, Smriti Practice, or Routine.'
    );
  };

  recognition.onerror = (event: any) => {
    console.error('🎙️ Voice error:', event.error);
    setIsListening(false);
  };

  recognition.onend = () => {
    console.log('🎙️ Voice recognition ended');
    setIsListening(false);
  };

  recognition.start();
}
  if (!user?.id) {
  setLoading(false);
  return;
}

  // Time & orientation ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real database history, mood, and build personalized daily plan
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);

      // 1. Fetch live game sessions
      const sessions = await fetchUserGameHistory(user.id);
      const { data: memoryData, error: memoryError } = await supabase
  .from('memory_items')
  .select('*')
  .eq('elderly_id', user.id)
  .order('created_at', { ascending: false });

if (!memoryError) {
  setMemories(memoryData || []);
}
      const computedJourney = calculateCognitiveJourney(sessions);
      setJourney(computedJourney);
      

      // 2. Fetch stored or initial mood
      const storedMoodRecord = getStoredMood();
      const initialMood = storedMoodRecord?.mood || null;
      if (initialMood) {
        setSelectedMood(initialMood);
        setMoodSubmitted(true);
      }

      // 3. Generate initial personalized plan
      const plan = generatePersonalizedPlan(sessions, initialMood, computedJourney.currentStreak);
      setPersonalizedPlan(plan);
      await syncPersonalizedPlan(user?.id, plan);

      // 4. Fetch daily care routine plans
      if (user?.id) {
        const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
console.log('Elderly user ID:', user.id);
console.log('Today:', todayStr);
     const { data: plans,error: plansError } = await supabase
  .from('daily_plans')
  .select('*')
  .eq('elderly_id', user.id)
  .eq('plan_date', todayStr)
  .order('scheduled_time', { ascending: true });
if (plansError) {
  alert(`Daily plans error: ${plansError.message}`);
  console.error('Daily plans error:', plansError);
}
        if (plans && plans.length > 0) {
  console.log('Daily care plans received:', plans);
  setDailyPlans(plans as DailyPlan[]);
} else {
  console.log('No daily care plans found');
  setDailyPlans([]);
}
      }

      setLoading(false);
    };

    loadDashboardData();
  }, [user]);

  // Handle 3-tier mood selection with dynamic plan recalibration
  const handleMoodSelect = async (mood: SimpleMood) => {
    setSelectedMood(mood);
    setMoodSubmitted(true);

    // 1. Save mood to Supabase & LocalStorage
    await saveMoodCheckin(user?.id, mood);

    // 2. Immediately recalibrate the personalized cognitive plan
    const sessions = await fetchUserGameHistory(user?.id);
    const streak = journey ? journey.currentStreak : 1;
    const recalibratedPlan = generatePersonalizedPlan(sessions, mood, streak);
    setPersonalizedPlan(recalibratedPlan);
    await syncPersonalizedPlan(user?.id, recalibratedPlan);
  };

  const toggleTask = async (planId: string) => {
  const task = dailyPlans.find((plan) => plan.id === planId);

  if (!task || !user?.id) return;

  const newCompletedState = !task.is_completed;
  const completedAt = newCompletedState
    ? new Date().toISOString()
    : null;

  // Update screen immediately
  setDailyPlans((prev) =>
    prev.map((plan) =>
      plan.id === planId
        ? {
            ...plan,
            is_completed: newCompletedState,
            completed_at: completedAt,
          }
        : plan
    )
  );

  // Save completion to Supabase
  const { error } = await supabase
    .from('daily_plans')
    .update({
      is_completed: newCompletedState,
      completed_at: completedAt,
    })
    .eq('id', planId)
    .eq('elderly_id', user.id);

  if (error) {
    console.error('Could not update care task:', error);

    // Revert screen if database update failed
    setDailyPlans((prev) =>
      prev.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              is_completed: task.is_completed,
              completed_at: task.completed_at,
            }
          : plan
      )
    );

    alert('Could not save the task. Please try again.');
  }
};

  const launchActivity = (gameId: CognitiveGameId) => {
    navigate(`/elderly/play/${gameId}`);
  };

 const language = profile?.primary_language || 'English';
const t = getTranslations(language);

const displayName = profile?.preferred_name || profile?.full_name || 'Friend';
  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (

      
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

    {/* VOICE ASSISTANT */}
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={voiceLanguage}
        onChange={(e) =>
          setVoiceLanguage(e.target.value as 'en-IN' | 'hi-IN')
        }
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
      >
        <option value="en-IN">English</option>
        <option value="hi-IN">हिंदी</option>
      </select>

      <button
        onClick={startVoice}
        className="rounded-2xl bg-indigo-600 px-5 py-3 text-white font-bold shadow-md"
      >
        🎙️ {isListening ? 'Listening...' : 'Talk to SmritiSetu'}
      </button>
    </div>
      
      {/* 1. Warm Greeting & Time Orientation Banner */}
      <section className="bg-gradient-to-r from-teal-800 to-emerald-700 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-3.5 py-1 rounded-full text-sm font-semibold mb-3">
              <Sparkles className="w-4 h-4 mr-1.5 text-amber-300" />
              North Eastern Region • {profile?.region || 'Assam'}
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              {t.greeting}, {displayName}!
            </h1>
            <p className="mt-2 text-teal-100 text-lg sm:text-xl font-medium">
              {t.welcome}
            </p>
          </div>

          {/* Orientation Clock */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 text-center flex-shrink-0">
            <div className="flex items-center justify-center space-x-2 text-amber-300 mb-1">
              <Clock className="w-6 h-6" />
              <span className="text-xs uppercase font-bold tracking-wider">{t.currentTime}</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold">{timeString}</div>
            <div className="text-xs sm:text-sm text-teal-100 mt-1 font-medium">{dateString}</div>
          </div>
        </div>
      </section>

      {/* 2. ACCESSIBLE 3-TIER MOOD CHECK-IN */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-teal-50 rounded-2xl text-teal-700">
              <Smile className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{t.feeling}</h2>
              <p className="text-slate-500 text-sm">{t.feelingHelp}</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400 hidden sm:inline">non-mediical comfort check</span>
        </div>
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-teal-200 shadow-md">
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
        Your Caregiver Code
      </p>
      <h2 className="text-xl font-extrabold text-slate-800 mt-1">
        Share this code with your caregiver
      </h2>
      <p className="text-sm text-slate-500 mt-1">
        Your caregiver can use this code to connect to your progress.
      </p>
    </div>

    <div className="flex items-center gap-2">
      <div className="px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 font-black tracking-wider text-lg text-slate-800">
        {profile?.patient_code || 'Generating...'}
      </div>

      <button
        type="button"
        onClick={handleCopyPatientCode}
        disabled={!profile?.patient_code}
        className="p-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50"
        title="Copy caregiver code"
      >
        <Copy className="w-5 h-5" />
      </button>
    </div>
  </div>
</section>

        {/* The 3 Clear Options: Good, Okay, Not good */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          
          {/* GOOD */}
          <button
            type="button"
            onClick={() => handleMoodSelect('good')}
            className={`p-5 rounded-2xl border-2 text-left transition-all touch-target flex items-center space-x-4 ${
              selectedMood === 'good'
                ? 'bg-emerald-50 border-emerald-500 ring-4 ring-emerald-400/20 shadow-md scale-102'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            <span className="text-4xl sm:text-5xl select-none">{MOOD_DEFINITIONS.good.emoji}</span>
            <div>
              <span className="block font-black text-slate-800 text-lg sm:text-xl">{t.good}</span>
              <span className="block text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                {MOOD_DEFINITIONS.good.description}
              </span>
            </div>
          </button>

          {/* OKAY */}
          <button
            type="button"
            onClick={() => handleMoodSelect('okay')}
            className={`p-5 rounded-2xl border-2 text-left transition-all touch-target flex items-center space-x-4 ${
              selectedMood === 'okay'
                ? 'bg-amber-50 border-amber-500 ring-4 ring-amber-400/20 shadow-md scale-102'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            <span className="text-4xl sm:text-5xl select-none">{MOOD_DEFINITIONS.okay.emoji}</span>
            <div>
              <span className="block font-black text-slate-800 text-lg sm:text-xl">{t.okay}</span>
              <span className="block text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                {MOOD_DEFINITIONS.okay.description}
              </span>
            </div>
          </button>

          {/* NOT GOOD */}
          <button
            type="button"
            onClick={() => handleMoodSelect('not_good')}
            className={`p-5 rounded-2xl border-2 text-left transition-all touch-target flex items-center space-x-4 ${
              selectedMood === 'not_good'
                ? 'bg-rose-50 border-rose-500 ring-4 ring-rose-400/20 shadow-md scale-102'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            <span className="text-4xl sm:text-5xl select-none">{MOOD_DEFINITIONS.not_good.emoji}</span>
            <div>
              <span className="block font-black text-slate-800 text-lg sm:text-xl">{t.notGood}</span>
              <span className="block text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                {MOOD_DEFINITIONS.not_good.description}
              </span>
            </div>
          </button>

        </div>

        {moodSubmitted && (
          <div className="mt-4 p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center space-x-3 text-xs sm:text-sm font-semibold">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500 flex-shrink-0" />
            <span>
              {t.thankYou}
            </span>
          </div>
        )}

        {/* Ethical Non-Medical Disclaimer */}
        <div className="mt-3 text-[11px] text-slate-400 flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{NON_MEDICAL_MOOD_DISCLAIMER}</span>
        </div>
      </section>

      {/* 3. TODAY'S PERSONALIZED COGNITIVE PLAN (2-3 Tailored Activities) */}
      {personalizedPlan && (
        <section className="bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <div className="inline-flex items-center space-x-2 bg-teal-500/20 text-teal-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-teal-400/30">
                <Brain className="w-4 h-4" />
                <span>Deterministic Personalized Plan</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {t.recommendedActivities}
              </h2>
              <p className="text-teal-200 text-sm mt-1">
                {personalizedPlan.overallGoal}
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-bold self-start sm:self-auto">
              <span>{personalizedPlan.activities.filter(a => a.isCompleted).length} / {personalizedPlan.activities.length} Completed</span>
            </div>
          </div>

          {/* Activity Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {personalizedPlan.activities.map((activity, idx) => (
              <div
                key={activity.id}
                className={`rounded-3xl p-6 border flex flex-col justify-between transition-all duration-300 ${
                  activity.isCompleted
                    ? 'bg-emerald-900/40 border-emerald-500/50 shadow-sm'
                    : 'bg-white/10 backdrop-blur-md border-white/20 hover:border-teal-400 hover:bg-white/15 shadow-md'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl select-none">{activity.icon}</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full capitalize bg-white/20 text-teal-100 border border-white/20">
                        {activity.difficulty}
                      </span>
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400/30 text-amber-200 border border-amber-300/40">
                        {activity.badge}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1">{activity.title}</h3>
                  <p className="text-xs sm:text-sm text-teal-100 leading-relaxed mb-4">
                    {activity.description}
                  </p>

                  {/* "Why this activity was selected" explanation card */}
                  <div className="p-3.5 rounded-2xl bg-black/20 border border-white/10 text-xs text-teal-100 leading-relaxed space-y-1">
                    <div className="flex items-center space-x-1.5 text-amber-300 font-bold">
                      <Lightbulb className="w-4 h-4" />
                      <span>Why this was selected:</span>
                    </div>
                    <p className="opacity-90">{activity.reason}</p>
                  </div>
                </div>

                {/* Launch Action */}
                <div className="mt-5 pt-4 border-t border-white/10">
                  {activity.isCompleted ? (
                    <div className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500/20 text-emerald-300 font-bold text-sm border border-emerald-500/40 flex items-center justify-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Completed Today</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => launchActivity(activity.gameId)}
                      className="w-full py-3.5 px-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-base shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2 touch-target"
                    >
                      <Play className="w-5 h-5 fill-slate-950" />
                      <span>{t.startActivity} ({activity.estimatedMinutes} min)</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center text-xs text-teal-200 opacity-80 pt-2">
            Deterministic plan generated dynamically • Recalibrates when you record your mood or complete activities.
          </div>
        </section>
      )}

      {/* 4. COGNITIVE JOURNEY SECTION */}
      {journey && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-teal-50 rounded-2xl text-teal-700">
                <Activity className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{t.cognitiveJourney}</h2>
                <p className="text-slate-500 text-sm">Your weekly habit, engagement milestones & adaptive progress</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-full border border-emerald-200 text-xs font-bold self-start sm:self-auto">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Live Database Records</span>
            </div>
          </div>
{/* 5. MY MEMORIES */}
<button
  onClick={() => navigate('/elderly/smriti-practice')}
  className="w-full rounded-2xl bg-blue-600 px-6 py-4 text-lg font-bold text-white"
>
  🧠 Start Smriti Practice
</button>
<section className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-200 shadow-md">
  <div className="flex items-center justify-between mb-5">
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
        My Memories
      </p>
      <h2 className="text-xl font-extrabold text-slate-800 mt-1">
        Special Moments & Familiar Things
      </h2>
      <p className="text-sm text-slate-500 mt-1">
        Revisit people, places, songs and cultural memories saved for you.
      </p>
    </div>
    <div className="text-3xl">🧠</div>
  </div>

  {memories.length === 0 ? (
    <div className="text-center py-8 rounded-2xl bg-amber-50 border border-amber-100">
      <p className="text-sm font-semibold text-slate-700">
        No memories have been added yet.
      </p>
      <p className="text-xs text-slate-500 mt-1">
        Your caregiver can add meaningful memories for you.
      </p>
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {memories.map((memory) => (
        <div
          key={memory.id}
          className="p-4 rounded-2xl bg-amber-50 border border-amber-100"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
            {memory.item_type?.replace('_', ' ')}
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-1">
            {memory.title}
          </h3>

          {memory.description && (
            <p className="text-sm text-slate-600 mt-2">
              {memory.description}
            </p>
          )}

          {memory.cultural_tag && (
            <span className="inline-block mt-3 px-2.5 py-1 rounded-full bg-white text-xs font-semibold text-amber-700 border border-amber-200">
              {memory.cultural_tag}
            </span>
          )}
        </div>
      ))}
    </div>
  )}
</section>
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Current Streak */}
            <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200">
              <div className="flex items-center justify-between text-orange-800 text-xs font-bold uppercase tracking-wider mb-1">
                <span>{t.streak}</span>
                <Flame className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-3xl font-black text-slate-800">
                {journey.currentStreak} <span className="text-sm font-bold text-orange-600">Days</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Best streak: {journey.bestStreak} days
              </div>
            </div>

            {/* Total Games Completed */}
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200">
              <div className="flex items-center justify-between text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
                <span>{t.activities}</span>
                <Award className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-3xl font-black text-slate-800">
                {journey.totalGamesCompleted} <span className="text-sm font-bold text-teal-700">Done</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Total completed exercises
              </div>
            </div>

            {/* Average Accuracy */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center justify-between text-emerald-800 text-xs ont-bold uppercase tracking-wider mb-1">
                <span>Average Accuracy</span>
                <Target className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-slate-800">
                {journey.averageAccuracy}%
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Overall recall precision
              </div>
            </div>

            {/* Weekly Target */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
              <div className="flex items-center justify-between text-blue-800 text-xs font-bold uppercase tracking-wider mb-1">
                <span>{t.weeklyGoal}</span>
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-black text-slate-800">
                {journey.weeklyActivity.filter(d => d.completed).length} <span className="text-sm font-bold text-blue-700">/ 5 Days</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Weekly habit consistency
              </div>
            </div>

          </div>

          {/* 7-Day Weekly Activity Visualizer */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Weekly Activity Calendar (Past 7 Days)
              </span>
              <span className="text-xs text-slate-500">
                {journey.weeklyActivity.filter(d => d.completed).length} active days
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center">
              {journey.weeklyActivity.map((day, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-between transition-all ${
                    day.isToday
                      ? 'border-teal-600 bg-white ring-2 ring-teal-500/20'
                      : day.completed
                      ? 'border-emerald-300 bg-emerald-50/80'
                      : 'border-slate-200 bg-white opacity-60'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-500">{day.dayName}</span>
                  <div className="my-1.5">
                    {day.completed ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300 text-xs">
                        •
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600">
                    {day.completed ? `${day.gamesCount} play` : 'Rest'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Performance History List */}
          <div>
            <div className="mb-4 p-4 rounded-2xl bg-purple-50 border border-purple-100">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-purple-700">
        Cognitive Progress
      </p>
      <p className="text-sm font-semibold text-purple-900 mt-1">
        Your recent performance is tracked to personalize future activities.
      </p>
    </div>
    <Activity className="w-6 h-6 text-purple-600" />
  </div>
</div>
            <div className="flex items-center space-x-2 text-slate-700 font-bold text-base mb-3">
              <History className="w-5 h-5 text-purple-600" />
              <span>Recent Performance History</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {journey.recentSessions.slice(0, 3).map((session, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/70 hover:bg-white hover:border-teal-200 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        {session.gameTitle}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize bg-teal-100 text-teal-800">
                        {session.difficulty} level
                      </span>
                    </div>
                    <div className="text-2xl font-black text-slate-800">
                      {session.score} <span className="text-xs font-semibold text-slate-500">pts</span>
                    </div>
                    {session.adaptiveReason && (
  <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
    <p className="text-[10px] font-bold text-amber-700 mb-0.5">
      Personalized adjustment
    </p>
    <p className="text-[11px] text-amber-900">
      {session.adaptiveReason}
    </p>
  </div>
)}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-700 flex items-center">
                      <Target className="w-3.5 h-3.5 mr-1" />
                      {session.accuracy}%
                    </span>
                    <span className="text-slate-500 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {session.durationSeconds}s
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ethical Non-Medical Disclaimer */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-start space-x-2.5 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{NON_MEDICAL_DISCLAIMER}</span>
          </div>

        </section>
      )}

      {/* 5. TODAY'S GENTLE CARE ROUTINE */}
      <section id="daily-routine" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-700">
            <CalendarCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{t.gentleRoutine}</h2>
            <p className="text-slate-500 text-sm">Small, comforting daily care activities planned for you</p>
          </div>
        </div>

        <div className="space-y-4">
          {dailyPlans.map(task => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`p-5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                task.is_completed
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    task.is_completed
                      ? 'bg-emerald-600 text-white'
                      : 'border-2 border-slate-400 bg-white text-transparent'
                  }`}
                >
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4
                    className={`text-lg font-bold ${
                      task.is_completed ? 'line-through text-slate-500' : 'text-slate-800'
                    }`}
                  >
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-sm text-slate-500 mt-0.5">{task.description}</p>
                  )}
                </div>
              </div>

              {task.scheduled_time && (
                <div className="text-sm font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 flex-shrink-0">
                  {task.scheduled_time}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. EMERGENCY ASSISTANCE */}
      <section className="bg-slate-100 rounded-3xl p-6 sm:p-8 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4 text-left">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-800">{t.needHelp}</h4>
            <p className="text-sm text-slate-500">
              Your registered emergency contact & family caregiver can be reached with one tap.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => alert(`Calling caregiver: ${profile?.emergency_contact_phone || 'Family Member'}`)}
          className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-base shadow-md flex items-center transition active:scale-95 flex-shrink-0"
        >
          <PhoneCall className="w-5 h-5 mr-2" />
          {t.reachCaregiver}
        </button>
      </section>

    </div>
  );
};
