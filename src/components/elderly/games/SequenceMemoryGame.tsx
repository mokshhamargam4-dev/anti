import React, { useState, useEffect } from 'react';
import { GameDifficulty, GameResult } from '../../../types/games';
import { getEncouragingMessage } from '../../../services/gameSessionService';
import { Play, RotateCcw, Clock, ChevronLeft, Sparkles, CheckCircle2, Volume2 } from 'lucide-react';

interface SequenceMemoryGameProps {
  difficulty: GameDifficulty;
  onDifficultyChange: (diff: GameDifficulty) => void;
  onComplete: (result: GameResult) => void;
  onBack: () => void;
}

interface PadDefinition {
  id: number;
  name: string;
  emoji: string;
  bgBase: string;
  bgActive: string;
  borderBase: string;
  borderActive: string;
  textColor: string;
}

const PADS: PadDefinition[] = [
  {
    id: 0,
    name: 'Bihu Dhol',
    emoji: '🥁',
    bgBase: 'bg-rose-50',
    bgActive: 'bg-rose-500 text-white scale-105 shadow-xl ring-4 ring-rose-300',
    borderBase: 'border-rose-200',
    borderActive: 'border-rose-500',
    textColor: 'text-rose-900',
  },
  {
    id: 1,
    name: 'Pink Lotus',
    emoji: '🪷',
    bgBase: 'bg-pink-50',
    bgActive: 'bg-pink-500 text-white scale-105 shadow-xl ring-4 ring-pink-300',
    borderBase: 'border-pink-200',
    borderActive: 'border-pink-500',
    textColor: 'text-pink-900',
  },
  {
    id: 2,
    name: 'River Boat',
    emoji: '⛵',
    bgBase: 'bg-sky-50',
    bgActive: 'bg-sky-500 text-white scale-105 shadow-xl ring-4 ring-sky-300',
    borderBase: 'border-sky-200',
    borderActive: 'border-sky-500',
    textColor: 'text-sky-900',
  },
  {
    id: 3,
    name: 'Tea Kettle',
    emoji: '🫖',
    bgBase: 'bg-amber-50',
    bgActive: 'bg-amber-500 text-white scale-105 shadow-xl ring-4 ring-amber-300',
    borderBase: 'border-amber-200',
    borderActive: 'border-amber-500',
    textColor: 'text-amber-900',
  },
];

const DIFFICULTY_CONFIG: Record<GameDifficulty, { length: number; displayIntervalMs: number; label: string }> = {
  easy: { length: 3, displayIntervalMs: 1100, label: 'Easy (3 Steps - Gentle)' },
  medium: { length: 4, displayIntervalMs: 900, label: 'Medium (4 Steps - Standard)' },
  hard: { length: 5, displayIntervalMs: 750, label: 'Challenging (5 Steps - Brisk)' },
};

type Stage = 'intro' | 'showing' | 'user_turn' | 'success_pause';

export const SequenceMemoryGame: React.FC<SequenceMemoryGameProps> = ({
  difficulty,
  onDifficultyChange,
  onComplete,
  onBack,
}) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [activePadId, setActivePadId] = useState<number | null>(null);
  const [stage, setStage] = useState<Stage>('intro');
  const [attempts, setAttempts] = useState<number>(1);
  const [mistakes, setMistakes] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [showingIndex, setShowingIndex] = useState<number>(0);

  const { length } = DIFFICULTY_CONFIG[difficulty];

  // Generate sequence
  const startNewSequence = () => {
    const newSeq: number[] = [];
    for (let i = 0; i < length; i++) {
      newSeq.push(Math.floor(Math.random() * 4));
    }
    setSequence(newSeq);
    setUserSequence([]);
    setActivePadId(null);
    setStage('intro');
    setShowingIndex(0);
  };

  useEffect(() => {
    startNewSequence();
    setAttempts(1);
    setMistakes(0);
    setElapsedSeconds(0);
  }, [difficulty]);

  // Overall timer
  useEffect(() => {
    if (stage === 'intro') return;

    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [stage]);

  // Play sequence playback animation
  const playSequence = () => {
    setStage('showing');
    setUserSequence([]);
    setShowingIndex(0);

    const { length, displayIntervalMs } = DIFFICULTY_CONFIG[difficulty];
    const highlightMs = Math.round(displayIntervalMs * 0.6);

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < sequence.length) {
        const padId = sequence[idx];
        setActivePadId(padId);
        setShowingIndex(idx + 1);

        setTimeout(() => {
          setActivePadId(null);
        }, highlightMs);

        idx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setStage('user_turn');
        }, 500);
      }
    }, displayIntervalMs);
  };

  // Handle user pad tap
  const handlePadClick = (padId: number) => {
    if (stage !== 'user_turn') return;

    // Momentary light up on tap
    setActivePadId(padId);
    setTimeout(() => setActivePadId(null), 250);

    const nextExpected = sequence[userSequence.length];

    if (padId === nextExpected) {
      // Correct tap
      const updated = [...userSequence, padId];
      setUserSequence(updated);

      // Check if user completed full sequence
      if (updated.length === sequence.length) {
        setStage('success_pause');
        
        const accuracy = Math.max(50, Math.round(((sequence.length) / (sequence.length + mistakes)) * 100));
        const speedBonus = Math.max(0, 30 - Math.floor(elapsedSeconds / 2));
        const score = Math.min(100, Math.round((accuracy * 0.75) + (speedBonus * 0.25)));

        const result: GameResult = {
          gameId: 'sequence-memory',
          gameTitle: 'Sequence Memory',
          difficulty,
          score: Math.max(50, score),
          maxScore: 100,
          accuracy,
          durationSeconds: elapsedSeconds,
          attempts,
          completedAt: new Date().toISOString(),
          encouragingFeedback: getEncouragingMessage(accuracy, difficulty),
        };

        setTimeout(() => {
          onComplete(result);
        }, 900);
      }
    } else {
      // Mistake: gentle retry
      setMistakes(prev => prev + 1);
      setAttempts(prev => prev + 1);
      setUserSequence([]);

      // Flash feedback
      alert('Almost! Take your time. Watch the sequence one more time.');
      playSequence();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* 1. Header */}
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
              Sequence Memory
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Watch the items light up, then repeat them in the same order
            </p>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {(['easy', 'medium', 'hard'] as GameDifficulty[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onDifficultyChange(level)}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold capitalize transition-colors ${
                difficulty === level
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Interactive Stage Status Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md text-center">
        {stage === 'intro' && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-slate-800">
              Ready to watch the sequence?
            </h3>
            <p className="text-slate-600 text-sm max-w-md mx-auto">
              We will light up {length} items one by one. Remember the pattern!
            </p>
            <button
              type="button"
              onClick={playSequence}
              className="inline-flex items-center px-6 py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-base shadow-lg transition active:scale-95"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Watching Pattern
            </button>
          </div>
        )}

        {stage === 'showing' && (
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 text-teal-700 font-bold text-sm bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Watching Item {showingIndex} of {sequence.length}</span>
            </div>
            <h3 className="text-2xl font-extrabold text-slate-800">
              Look closely at the glowing item...
            </h3>
          </div>
        )}

        {stage === 'user_turn' && (
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 text-emerald-800 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Your Turn!</span>
            </div>
            <h3 className="text-2xl font-extrabold text-slate-800">
              Touch the items in the same order!
            </h3>
            
            {/* Step progress dots */}
            <div className="flex justify-center space-x-2 pt-1">
              {sequence.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all ${
                    idx < userSequence.length
                      ? 'bg-teal-600 scale-110'
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {stage === 'success_pause' && (
          <div className="text-emerald-700 font-bold text-xl py-2 flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-7 h-7" />
            <span>Wonderful! Pattern completed correctly!</span>
          </div>
        )}
      </div>

      {/* 3. The 4 Large Sensory Touch Pads */}
      <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
        {PADS.map(pad => {
          const isActive = activePadId === pad.id;

          return (
            <button
              key={pad.id}
              type="button"
              disabled={stage !== 'user_turn'}
              onClick={() => handlePadClick(pad.id)}
              className={`p-6 sm:p-8 rounded-3xl border-2 flex flex-col items-center justify-center transition-all duration-200 touch-target transform active:scale-95 ${
                isActive
                  ? pad.bgActive
                  : `${pad.bgBase} ${pad.borderBase} hover:border-slate-400 shadow-md`
              }`}
            >
              <span className="text-6xl sm:text-7xl mb-2 select-none">{pad.emoji}</span>
              <span className={`font-extrabold text-base sm:text-lg ${isActive ? 'text-white' : pad.textColor}`}>
                {pad.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Option to Replay Pattern if Needed */}
      {stage === 'user_turn' && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={playSequence}
            className="inline-flex items-center px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-bold text-sm bg-slate-100 hover:bg-slate-200 transition"
          >
            <RotateCcw className="w-4 h-4 mr-1.5 text-slate-500" />
            Show pattern again
          </button>
        </div>
      )}

    </div>
  );
};
