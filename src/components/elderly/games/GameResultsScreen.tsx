import React from 'react';
import { GameResult, CognitiveGameId } from '../../../types/games';
import { Award, Clock, Target, RotateCcw, ArrowRight, Home, Sparkles, CheckCircle } from 'lucide-react';

interface GameResultsScreenProps {
  result: GameResult;
  onPlayAgain: () => void;
  onPlayNext: (nextGameId: CognitiveGameId) => void;
  onBackHome: () => void;
}

const GAME_ROTATION: Record<CognitiveGameId, { nextId: CognitiveGameId; nextTitle: string }> = {
  'memory-match': { nextId: 'remember-objects', nextTitle: 'Remember the Objects' },
  'remember-objects': { nextId: 'sequence-memory', nextTitle: 'Sequence Memory' },
  'sequence-memory': { nextId: 'memory-match', nextTitle: 'Memory Match' },
};

export const GameResultsScreen: React.FC<GameResultsScreenProps> = ({
  result,
  onPlayAgain,
  onPlayNext,
  onBackHome,
}) => {
  const nextInfo = GAME_ROTATION[result.gameId];

  const formatMinutes = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8 bg-white rounded-3xl border-2 border-teal-200/80 shadow-2xl text-center animate-gentle">
      
      {/* 1. Header Trophy & Congratulatory Title */}
      <div className="flex justify-center mb-4">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform">
          <Award className="w-12 h-12 text-amber-950" />
        </div>
      </div>

      <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider mb-2">
        <Sparkles className="w-4 h-4 text-teal-600" />
        <span>Exercise Completed</span>
      </div>

      <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
        {result.gameTitle} Completed!
      </h2>

      <p className="mt-3 text-base sm:text-lg text-slate-600 font-medium px-4">
        {result.encouragingFeedback}
      </p>

      {/* 2. Key Metrics Grid (Score, Accuracy, Time, Attempts) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-8 text-left">
        
        {/* Score */}
        <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl">
          <div className="flex items-center text-amber-800 text-xs font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4 mr-1" />
            Score
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-950">
            {result.score}
            <span className="text-xs text-amber-700 font-bold ml-1">pts</span>
          </div>
        </div>

        {/* Accuracy */}
        <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl">
          <div className="flex items-center text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
            <Target className="w-4 h-4 mr-1" />
            Accuracy
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-950">
            {result.accuracy}%
          </div>
        </div>

        {/* Time */}
        <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-2xl">
          <div className="flex items-center text-blue-800 text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4 mr-1" />
            Time Taken
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-950">
            {formatMinutes(result.durationSeconds)}
          </div>
        </div>

        {/* Attempts */}
        <div className="bg-purple-50/80 border border-purple-200 p-4 rounded-2xl">
          <div className="flex items-center text-purple-800 text-xs font-bold uppercase tracking-wider mb-1">
            <RotateCcw className="w-4 h-4 mr-1" />
            Attempts
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-950">
            {result.attempts}
          </div>
        </div>

      </div>

      {/* 3. Reassuring Progress Notification & Adaptive Insight */}
      <div className="space-y-2 mb-8">
        <div className="bg-teal-50 border border-teal-200/80 p-4 rounded-2xl flex items-center justify-center space-x-3 text-teal-900 text-sm font-semibold">
          <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
          <span>This session is saved to your personal care record & daily streak.</span>
        </div>

        {result.adaptiveReason && (
          <div className="bg-amber-50/70 border border-amber-200/60 px-4 py-2 rounded-xl text-xs text-amber-900 font-medium flex items-center justify-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Adaptive Insight: {result.adaptiveReason}</span>
          </div>
        )}
      </div>

      {/* 4. Action Buttons */}
      <div className="space-y-3">
        {/* Play Next Activity CTA */}
        <button
          type="button"
          onClick={() => onPlayNext(nextInfo.nextId)}
          className="w-full flex items-center justify-center py-4 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.98] min-h-[54px]"
        >
          <span>Play Next: {nextInfo.nextTitle}</span>
          <ArrowRight className="w-6 h-6 ml-2" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex items-center justify-center py-3.5 px-4 rounded-2xl border-2 border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-base transition-colors min-h-[50px]"
          >
            <RotateCcw className="w-5 h-5 mr-2 text-slate-500" />
            Play Again
          </button>

          <button
            type="button"
            onClick={onBackHome}
            className="flex items-center justify-center py-3.5 px-4 rounded-2xl border-2 border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-base transition-colors min-h-[50px]"
          >
            <Home className="w-5 h-5 mr-2 text-slate-500" />
            Return to Dashboard
          </button>
        </div>
      </div>

    </div>
  );
};
