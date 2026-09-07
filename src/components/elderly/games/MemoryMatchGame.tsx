import React, { useState, useEffect } from 'react';
import { GameDifficulty, GameResult, CulturalItem } from '../../../types/games';
import { CULTURAL_OBJECTS } from '../../../data/culturalObjects';
import { getEncouragingMessage } from '../../../services/gameSessionService';
import { Sparkles, Clock, RotateCcw, Award, CheckCircle2, ChevronLeft } from 'lucide-react';
import {getTranslations} from '../../../services/languageService';
import {useAuth} from '../../../context/AuthContext';
interface MemoryMatchGameProps {
  difficulty: GameDifficulty;
  onDifficultyChange: (diff: GameDifficulty) => void;
  onComplete: (result: GameResult) => void;
  onBack: () => void;
}

interface CardState {
  instanceId: string;
  item: CulturalItem;
  isFlipped: boolean;
  isMatched: boolean;
}

const DIFFICULTY_CONFIG: Record<GameDifficulty, { pairs: number; gridClass: string; label: string }> = {
  easy: { pairs: 3, gridClass: 'grid-cols-2 sm:grid-cols-3', label: 'Easy (3 Pairs)' },
  medium: { pairs: 6, gridClass: 'grid-cols-3 sm:grid-cols-4', label: 'Medium (6 Pairs)' },
  hard: { pairs: 8, gridClass: 'grid-cols-4', label: 'Challenging (8 Pairs)' },
};

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({
  difficulty,
  onDifficultyChange,
  onComplete,
  onBack,
}) => {
  const {profile} = useAuth();
  const language = profile?.primary_language || 'English';
  const t = getTranslations(language);  
  const [cards, setCards] = useState<CardState[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [attempts, setAttempts] = useState<number>(0);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  const { pairs, gridClass } = DIFFICULTY_CONFIG[difficulty];

  // Initialize and shuffle cards
  const initializeGame = () => {
    // Select subset of objects
    const shuffledItems = [...CULTURAL_OBJECTS].sort(() => Math.random() - 0.5).slice(0, pairs);
    
    // Duplicate into pairs
    const deck: CardState[] = [];
    shuffledItems.forEach((item, idx) => {
      deck.push({
        instanceId: `${item.id}-1`,
        item,
        isFlipped: false,
        isMatched: false,
      });
      deck.push({
        instanceId: `${item.id}-2`,
        item,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle the pairs
    deck.sort(() => Math.random() - 0.5);

    setCards(deck);
    setFlippedIndices([]);
    setAttempts(0);
    setMatchedPairs(0);
    setElapsedSeconds(0);
    setIsLocked(false);
    setHasStarted(true);
  };

  useEffect(() => {
    initializeGame();
  }, [difficulty]);

  // Timer ticker
  useEffect(() => {
    if (!hasStarted || matchedPairs === pairs) return;

    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStarted, matchedPairs, pairs]);

  // Handle card touch / click
  const handleCardClick = (index: number) => {
    if (isLocked) return;
    const card = cards[index];
    if (card.isFlipped || card.isMatched) return;

    // Flip the tapped card
    const updatedCards = [...cards];
    updatedCards[index].isFlipped = true;
    setCards(updatedCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    // If two cards are now flipped, evaluate match
    if (newFlipped.length === 2) {
      setAttempts(prev => prev + 1);
      setIsLocked(true);

      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = updatedCards[firstIdx];
      const secondCard = updatedCards[secondIdx];

      if (firstCard.item.id === secondCard.item.id) {
        // MATCH!
        setTimeout(() => {
          const matchedDeck = [...updatedCards];
          matchedDeck[firstIdx].isMatched = true;
          matchedDeck[secondIdx].isMatched = true;
          setCards(matchedDeck);
          setFlippedIndices([]);
          setIsLocked(false);
          setMatchedPairs(prev => prev + 1);
        }, 500);
      } else {
        // NO MATCH: Flip back after calm delay
        setTimeout(() => {
          const resetDeck = [...updatedCards];
          resetDeck[firstIdx].isFlipped = false;
          resetDeck[secondIdx].isFlipped = false;
          setCards(resetDeck);
          setFlippedIndices([]);
          setIsLocked(false);
        }, 1100);
      }
    }
  };

  // Check victory condition
  useEffect(() => {
    if (pairs > 0 && matchedPairs === pairs) {
      // Calculate score and accuracy
      const minAttempts = pairs;
      const accuracy = Math.min(100, Math.max(40, Math.round((minAttempts / Math.max(attempts, minAttempts)) * 100)));
      const baseScore = pairs * 15;
      const speedBonus = Math.max(0, 50 - Math.floor(elapsedSeconds / 2));
      const finalScore = Math.min(100, Math.round((accuracy * 0.7) + (speedBonus * 0.3)));

      const result: GameResult = {
        gameId: 'memory-match',
        gameTitle: 'Memory Match Cards',
        difficulty,
        score: Math.max(50, finalScore),
        maxScore: 100,
        accuracy,
        durationSeconds: elapsedSeconds,
        attempts,
        completedAt: new Date().toISOString(),
        encouragingFeedback: getEncouragingMessage(accuracy, difficulty),
      };

      // Slight pause for peaceful celebratory moment
      const timer = setTimeout(() => {
        onComplete(result);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [matchedPairs, pairs]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* 1. Header with Difficulty Selector & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition shadow-sm touch-target"
            title={t.back}
            aria-label="Back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              {t.memoryMatch}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              {t.memoryMatchHelp}
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

      {/* 2. In-Game Friendly Progress Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-around text-center">
        <div className="flex items-center space-x-2 text-slate-700">
          <Clock className="w-5 h-5 text-teal-700" />
          <span className="text-xs uppercase font-bold text-slate-500">{t.time}:</span>
          <span className="text-lg font-extrabold">{formatTimer(elapsedSeconds)}</span>
        </div>

        <div className="h-8 w-px bg-slate-200" />

        <div className="flex items-center space-x-2 text-slate-700">
          <RotateCcw className="w-5 h-5 text-amber-700" />
          <span className="text-xs uppercase font-bold text-slate-500">{t.attempts}:</span>
          <span className="text-lg font-extrabold">{attempts}</span>
        </div>

        <div className="h-8 w-px bg-slate-200" />

        <div className="flex items-center space-x-2 text-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          <span className="text-xs uppercase font-bold text-slate-500">{t.matched}:</span>
          <span className="text-lg font-extrabold text-emerald-800">
            {matchedPairs} / {pairs}
          </span>
        </div>
      </div>

      {/* 3. Card Grid */}
      <div className={`grid ${gridClass} gap-3 sm:gap-4`}>
        {cards.map((card, index) => {
          const isOpen = card.isFlipped || card.isMatched;

          return (
            <button
              key={card.instanceId}
              type="button"
              onClick={() => handleCardClick(index)}
              disabled={isLocked || card.isMatched}
              aria-label={isOpen ? card.item.name : `${t.hiddenCard}  ${index + 1}`}
              className={`min-h-[110px] sm:min-h-[140px] p-3 rounded-3xl border-2 flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 touch-target ${
                card.isMatched
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-sm opacity-90'
                  : isOpen
                  ? 'bg-white border-teal-600 shadow-lg scale-102 ring-2 ring-teal-500/20'
                  : 'bg-gradient-to-br from-teal-800 to-emerald-800 border-teal-700 text-teal-100 hover:brightness-105 shadow-md'
              }`}
            >
              {isOpen ? (
                <>
                  <span className="text-4xl sm:text-5xl mb-1 select-none">
                    {card.item.emoji}
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-800 text-center leading-tight">
                    {card.item.name}
                  </span>
                  {card.isMatched && (
                    <span className="text-[11px] font-bold text-emerald-700 mt-1 flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-0.5" /> Matched
                    </span>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <Sparkles className="w-7 h-7 text-amber-300 opacity-80 mb-1" />
                  <span className="text-xs font-bold text-teal-100 uppercase tracking-wider">
                    Touch Me
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Encouraging Help Prompt */}
      <div className="p-4 bg-teal-50/70 border border-teal-200/60 rounded-2xl text-center text-teal-900 text-sm font-medium">
        Take as much time as you like. Touch any two cards to reveal their pictures and match them!
      </div>

    </div>
  );
};