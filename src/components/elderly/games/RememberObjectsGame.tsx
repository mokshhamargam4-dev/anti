import React, { useState, useEffect } from 'react';
import { GameDifficulty, GameResult, CulturalItem } from '../../../types/games';
import { CULTURAL_OBJECTS } from '../../../data/culturalObjects';
import { getEncouragingMessage } from '../../../services/gameSessionService';
import { Eye, CheckCircle2, Clock, ChevronLeft, ArrowRight, Sparkles, Check } from 'lucide-react';

interface RememberObjectsGameProps {
  difficulty: GameDifficulty;
  onDifficultyChange: (diff: GameDifficulty) => void;
  onComplete: (result: GameResult) => void;
  onBack: () => void;
}

type GamePhase = 'memorize' | 'recall';

const DIFFICULTY_CONFIG: Record<GameDifficulty, { count: number; viewingSeconds: number; poolSize: number; label: string }> = {
  easy: { count: 3, viewingSeconds: 10, poolSize: 6, label: 'Easy (3 Objects)' },
  medium: { count: 5, viewingSeconds: 12, poolSize: 9, label: 'Medium (5 Objects)' },
  hard: { count: 7, viewingSeconds: 15, poolSize: 12, label: 'Challenging (7 Objects)' },
};

export const RememberObjectsGame: React.FC<RememberObjectsGameProps> = ({
  difficulty,
  onDifficultyChange,
  onComplete,
  onBack,
}) => {
  const [phase, setPhase] = useState<GamePhase>('memorize');
  const [targetObjects, setTargetObjects] = useState<CulturalItem[]>([]);
  const [choicePool, setChoicePool] = useState<CulturalItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(10);
  const [totalViewingTime, setTotalViewingTime] = useState<number>(10);
  const [elapsedRecallSeconds, setElapsedRecallSeconds] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(1);

  const { count, viewingSeconds, poolSize } = DIFFICULTY_CONFIG[difficulty];

  // Start new game session
  const startNewGame = () => {
    // 1. Shuffle and pick target objects
    const shuffled = [...CULTURAL_OBJECTS].sort(() => Math.random() - 0.5);
    const targets = shuffled.slice(0, count);

    // 2. Add distractors from remaining objects
    const distractors = shuffled.slice(count, poolSize);
    const pool = [...targets, ...distractors].sort(() => Math.random() - 0.5);

    setTargetObjects(targets);
    setChoicePool(pool);
    setSelectedIds([]);
    setPhase('memorize');
    setSecondsRemaining(viewingSeconds);
    setTotalViewingTime(viewingSeconds);
    setElapsedRecallSeconds(0);
    setAttempts(1);
  };

  useEffect(() => {
    startNewGame();
  }, [difficulty]);

  // Phase 1: Memorization Timer
  useEffect(() => {
    if (phase !== 'memorize') return;

    if (secondsRemaining <= 0) {
      setPhase('recall');
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, secondsRemaining]);

  // Phase 2: Recall Timer
  useEffect(() => {
    if (phase !== 'recall') return;

    const timer = setInterval(() => {
      setElapsedRecallSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // Toggle selection
  const handleSelectObject = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(item => item !== id));
    } else {
      if (selectedIds.length < count) {
        setSelectedIds(prev => [...prev, id]);
      }
    }
  };

  // Submit and verify recalled objects
  const handleVerify = () => {
    const targetIds = new Set(targetObjects.map(t => t.id));
    let correctCount = 0;

    selectedIds.forEach(id => {
      if (targetIds.has(id)) {
        correctCount++;
      }
    });

    const accuracy = Math.round((correctCount / count) * 100);
    const totalDuration = totalViewingTime + elapsedRecallSeconds;
    const baseScore = accuracy;
    const speedBonus = Math.max(0, 20 - Math.floor(elapsedRecallSeconds / 2));
    const score = Math.min(100, Math.round((baseScore * 0.8) + (speedBonus * 0.2)));

    const result: GameResult = {
      gameId: 'remember-objects',
      gameTitle: 'Remember the Objects',
      difficulty,
      score: Math.max(50, score),
      maxScore: 100,
      accuracy,
      durationSeconds: totalDuration,
      attempts,
      completedAt: new Date().toISOString(),
      encouragingFeedback: getEncouragingMessage(accuracy, difficulty),
    };

    onComplete(result);
  };

  const progressPercentage = Math.round(((totalViewingTime - secondsRemaining) / totalViewingTime) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* 1. Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition shadow-sm touch-target"
            aria-label="Back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              Remember the Objects
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Look closely at the items, then tell us which ones you remember
            </p>
          </div>
        </div>

        {/* Difficulty Selector */}
      <div className="px-4 py-2 rounded-2xl bg-teal-50 border border-teal-200 text-center">
  <span className="text-xs text-teal-700 font-bold uppercase tracking-wider">
    Adaptive Level
  </span>
  <div className="text-sm font-extrabold text-teal-900 capitalize">
    {difficulty}
  </div>
</div>
      </div>

      {/* PHASE 1: MEMORIZE */}
      {phase === 'memorize' && (
        <div className="space-y-6 animate-gentle">
          {/* Instructions banner with countdown */}
          <div className="bg-gradient-to-r from-teal-800 to-emerald-700 text-white rounded-3xl p-6 shadow-xl text-center relative overflow-hidden">
            <div className="flex items-center justify-center space-x-2 text-amber-300 mb-2">
              <Eye className="w-6 h-6" />
              <span className="text-sm font-bold uppercase tracking-wider">Step 1: Look & Remember</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold">
              Remember these {count} items
            </h3>
            <p className="text-teal-100 text-sm mt-1">
              They will be hidden in a few moments. Take your time to look at them.
            </p>

            {/* Visual gentle progress bar */}
            <div className="mt-6 max-w-md mx-auto">
              <div className="w-full bg-white/20 rounded-full h-3.5 overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs text-teal-100 mt-2 font-bold">
                <span>Observing...</span>
                <span>{secondsRemaining} seconds left</span>
              </div>
            </div>

            {/* Ready early button */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setPhase('recall')}
                className="px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-sm backdrop-blur-sm border border-white/30 transition shadow-sm"
              >
                I am ready now!
              </button>
            </div>
          </div>

          {/* Shown Target Objects Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {targetObjects.map(item => (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-white border-2 border-teal-300/80 shadow-md text-center flex flex-col items-center justify-center"
              >
                <span className="text-5xl sm:text-6xl mb-2 select-none">{item.emoji}</span>
                <span className="font-extrabold text-slate-800 text-base">{item.name}</span>
                {item.localName && (
                  <span className="text-xs text-teal-700 font-semibold mt-0.5">{item.localName}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PHASE 2: RECALL */}
      {phase === 'recall' && (
        <div className="space-y-6">
          {/* Selection status banner */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-teal-800 font-bold text-sm">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <span>Step 2: Touch the items that were shown</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-1">
                Which items did you see?
              </h3>
            </div>

            <div className="flex items-center space-x-3 bg-teal-50 px-4 py-2.5 rounded-2xl border border-teal-200 flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-teal-700" />
              <div>
                <span className="text-xs uppercase font-bold text-teal-800">Selected</span>
                <div className="text-lg font-extrabold text-teal-950">
                  {selectedIds.length} of {count}
                </div>
              </div>
            </div>
          </div>

          {/* Choice Pool Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {choicePool.map(item => {
              const isSelected = selectedIds.includes(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectObject(item.id)}
                  aria-pressed={isSelected}
                  className={`p-5 rounded-3xl border-2 text-center flex flex-col items-center justify-center transition-all transform active:scale-95 touch-target ${
                    isSelected
                      ? 'bg-teal-50 border-teal-600 ring-4 ring-teal-500/20 shadow-lg scale-102'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="relative">
                    <span className="text-5xl sm:text-6xl mb-2 block select-none">{item.emoji}</span>
                    {isSelected && (
                      <div className="absolute -top-1 -right-2 w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-md">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <span className="font-extrabold text-slate-800 text-base mt-1">{item.name}</span>
                  {item.localName && (
                    <span className="text-xs text-slate-500 font-medium mt-0.5">{item.localName}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="button"
              onClick={handleVerify}
              disabled={selectedIds.length === 0}
              className="w-full py-4 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.98] min-h-[54px] flex items-center justify-center"
            >
              <span>Check My Answers</span>
              <ArrowRight className="w-6 h-6 ml-2" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
