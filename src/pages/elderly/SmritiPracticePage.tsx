import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
type MemoryItem = {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
};
import { useNavigate } from 'react-router-dom';
export default function SmritiPracticePage() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(8);
  const [started, setStarted] = useState(false);
  const navigate = useNavigate();
  const[round,setRound]=useState(1);
const [selectedMemories, setSelectedMemories] = useState<string[]>([]);
const [finished, setFinished] = useState(false);
const recallScore = selectedMemories.filter((id) =>
  memories.some((memory) => memory.id === id)
).length;
  useEffect(() => {
    loadMemories();
  }, []);
  useEffect(() => {
  if (!started) return;

  if (timeLeft <= 0) {
    if (round === 1) {
      setRound(2);
      setTimeLeft(7);
    }
    return;
  }

  const timer = setInterval(() => {
    setTimeLeft((previous) => previous - 1);
  }, 1000);

  return () => clearInterval(timer);
}, [started, timeLeft, round]);
  async function loadMemories() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('memory_items')
      .select('*')
      .eq('elderly_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading memories:', error);
      setLoading(false);
      return;
    }

    setMemories((data || []).slice(0, 4));
    setLoading(false);
  } catch (error) {
    console.error('Error loading memories:', error);
    setLoading(false);
  }
}

  function startPractice() {
    setStarted(true);
    setTimeLeft(8);
  }

  if (loading) {
    return <div className="p-6">Loading memories...</div>;
  }
  async function savePracticeResult() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const maxScore = memories.length;
  const score = recallScore;

  const { error } = await supabase.from('game_sessions').insert({
    elderly_id: user.id,
    game_type: 'smriti_practice',
    difficulty_level: 'adaptive',
    score,
    max_score: maxScore,
    duration_seconds: 18,
    accuracy_rate: maxScore > 0 ? (score / maxScore) * 100 : 0,
    metrics: {
      round: 'memory_recall',
      memories_shown: maxScore,
      memories_recalled: score,
    },
    completed_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Error saving Smriti Practice:', error);
  }
}
  if (finished) {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 text-center shadow">
        <div className="text-5xl">🎉</div>

        <h1 className="mt-4 text-3xl font-bold text-slate-800">
          Practice Complete!
        </h1>

        <p className="mt-3 text-slate-600">
          You remembered
        </p>

        <div className="mt-4 text-5xl font-bold text-blue-600">
          {recallScore} / {memories.length}
        </div>

        <p className="mt-4 text-slate-600">
          Great effort! Keep practising regularly.
        </p>
      </div>
    </div>
  );
}
  if (started && round === 3 && !finished) {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-800">
          🧠 Round 3 — Recall
        </h1>

        <p className="mt-2 text-slate-600">
          Which memories do you remember?
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {memories.map((memory) => {
            const selected = selectedMemories.includes(memory.id);

            return (
              <button
                key={memory.id}
                onClick={() => {
                  setSelectedMemories((previous) =>
                    selected
                      ? previous.filter((id) => id !== memory.id)
                      : [...previous, memory.id]
                  );
                }}
                className={`rounded-2xl border-2 p-5 text-left ${
                  selected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <h3 className="text-lg font-bold">
                  {memory.title}
                </h3>

                {memory.description && (
                  <p className="mt-1 text-slate-600">
                    {memory.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={async () => {
  await savePracticeResult();
  setFinished(true);
}}
          className="mt-8 w-full rounded-xl bg-blue-600 px-6 py-4 text-white font-bold"
        >
          Finish Recall
        </button>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-800">
          🧠 Smriti Practice
        </h1>

        <p className="mt-2 text-slate-600">
          Let&apos;s remember some familiar things.
        </p>

        {!started ? (
  <div className="mt-8 rounded-2xl bg-white p-8 shadow">
    <h2 className="text-xl font-semibold">
      Round 1 — Remember
    </h2>

    <p className="mt-2 text-slate-600">
      You will see a few familiar memories. Try to remember them.
    </p>

    <button
      onClick={startPractice}
      className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white"
    >
      Start
    </button>
  </div>
) : (
  <div className="mt-8">

    {round === 1 ? (
      <>
        <h2 className="text-2xl font-bold text-center">
          Round 1 — Remember
        </h2>

        <p className="mt-2 text-center text-slate-600">
          Remember these memories!
        </p>

        <div className="mt-4 text-center text-4xl font-bold text-blue-600">
          {timeLeft}s
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mt-6">
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="rounded-2xl bg-white p-5 shadow"
            >
              {memory.image_url && (
                <img
                  src={memory.image_url}
                  alt={memory.title}
                  className="mb-4 h-40 w-full rounded-xl object-cover"
                />
              )}

              <h3 className="text-lg font-bold">
                {memory.title}
              </h3>

              {memory.description && (
                <p className="mt-1 text-slate-600">
                  {memory.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </>
    ) : (
      <>
        <h2 className="text-2xl font-bold text-center">
          Round 2 — Focus
        </h2>

        <p className="mt-3 text-center text-slate-600">
          Take a short break and focus.
        </p>

        <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow">
          <div className="text-6xl">🔵</div>

          <p className="mt-6 text-xl font-semibold">
            Count slowly from 1 to 5
          </p>

          <div className="mt-4 text-4xl font-bold text-blue-600">
            {timeLeft}s
          </div>
          <button
  onClick={() => {
    setRound(3);
    setTimeLeft(0);
  }}
  className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white"
>
  Continue to Recall
</button>
        </div>
      </>
    )}

  </div>
)}
      </div>
    </div>
  );
}