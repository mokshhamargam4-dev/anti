
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CognitiveGameId, GameDifficulty, GameResult } from '../../types/games';
import { MemoryMatchGame } from '../../components/elderly/games/MemoryMatchGame';
import { RememberObjectsGame } from '../../components/elderly/games/RememberObjectsGame';
import { SequenceMemoryGame } from '../../components/elderly/games/SequenceMemoryGame';
import { GameResultsScreen } from '../../components/elderly/games/GameResultsScreen';
import { saveGameSession, fetchUserGameHistory } from '../../services/gameSessionService';
import { calculateAdaptiveDifficulty, NON_MEDICAL_DISCLAIMER, AdaptiveDecision } from '../../services/adaptiveDifficulty';
import { Sparkles, Info, ShieldCheck } from 'lucide-react';

export const GamePlayerPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeGameId, setActiveGameId] = useState<CognitiveGameId>(
    (gameId as CognitiveGameId) || 'memory-match'
  );
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
  const [adaptiveDecision, setAdaptiveDecision] = useState<AdaptiveDecision | null>(null);
  const [completedResult, setCompletedResult] = useState<GameResult | null>(null);
  const [loadingAdaptive, setLoadingAdaptive] = useState<boolean>(true);

  // Initialize adaptive difficulty on mount or game change
  useEffect(() => {
    const initAdaptiveLevel = async () => {
      setLoadingAdaptive(true);
      const history = await fetchUserGameHistory(user?.id);
      const decision = calculateAdaptiveDifficulty(activeGameId, history);
      console.log('GAME:', activeGameId);
console.log('HISTORY:', history);
console.log('ADAPTIVE DECISION:', decision);
      
      setAdaptiveDecision(decision);
      setDifficulty(decision.difficulty);
      setLoadingAdaptive(false);
    };

    initAdaptiveLevel();
  }, [activeGameId, user]);

  const handleGameComplete = async (result: GameResult) => {
    // Attach adaptive reason
    const enhancedResult: GameResult = {
      ...result,
      adaptiveReason: adaptiveDecision?.reason || 'Standard calibrated pace',
    };

    setCompletedResult(enhancedResult);
    await saveGameSession(user?.id, enhancedResult);
  };

  const handlePlayAgain = async () => {
    setLoadingAdaptive(true);

  const history = await fetchUserGameHistory(user?.id);
  const decision = calculateAdaptiveDifficulty(activeGameId, history);

  setAdaptiveDecision(decision);
  setDifficulty(decision.difficulty);
  setCompletedResult(null);
  setLoadingAdaptive(false);
  };

  const handlePlayNext = (nextId: CognitiveGameId) => {
    setActiveGameId(nextId);
    setCompletedResult(null);
    navigate(`/elderly/play/${nextId}`, { replace: true });
  };

  const handleBackHome = () => {
    navigate('/elderly');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Adaptive Difficulty Guidance Banner */}
        {!completedResult && adaptiveDecision && (
          <div className="mb-6 p-4 rounded-2xl bg-white border border-teal-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-700 flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                    Personalised difficulty for you
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize bg-teal-100 text-teal-900">
                    YOUR {difficulty} Level
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  {adaptiveDecision.reason}
                </p>
              </div>
            </div>

            <div className="text-right flex-shrink-0 hidden md:block">
              <span className="text-[11px] text-slate-400 font-medium block">
                Comfort-first automatic pacing
              </span>
            </div>
          </div>
        )}

        {/* Game Execution */}
        {completedResult ? (
          <GameResultsScreen
            result={completedResult}
            onPlayAgain={handlePlayAgain}
            onPlayNext={handlePlayNext}
            onBackHome={handleBackHome}
          />
        ) : (
          <>
            {activeGameId === 'memory-match' && (
            <MemoryMatchGame
  difficulty={difficulty}
  onDifficultyChange={() => {}}
  onComplete={handleGameComplete}
  onBack={handleBackHome}
/>
            )}

            {activeGameId === 'remember-objects' && (
            <RememberObjectsGame
  difficulty={difficulty}
  onDifficultyChange={() => {}}
  onComplete={handleGameComplete}
  onBack={handleBackHome}
/>
            )}

            {activeGameId === 'sequence-memory' && (
              <SequenceMemoryGame
  difficulty={difficulty}
  onDifficultyChange={() => {}}
  onComplete={handleGameComplete}
  onBack={handleBackHome}
/>

            )}
          </>
        )}

        {/* Clinical non-medical disclaimer banner */}
        <div className="mt-8 p-3 rounded-2xl bg-slate-100/80 border border-slate-200 text-center flex items-center justify-center space-x-2 text-slate-500 text-xs">
          <Info className="w-4 h-4 flex-shrink-0 text-slate-400" />
          <span>{NON_MEDICAL_DISCLAIMER}</span>
        </div>

      </div>
    </div>
  );
};
      
     