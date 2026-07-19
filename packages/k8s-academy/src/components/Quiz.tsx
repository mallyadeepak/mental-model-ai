import { useState } from 'react';
import type { QuizQuestion } from '../data/types';

export function Quiz({ questions, onComplete }: { questions: QuizQuestion[]; onComplete: (correct: number, total: number) => void }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  if (questions.length === 0) return null;

  const q = questions[index];
  const isLast = index === questions.length - 1;

  const choose = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.correctIndex) setCorrectCount((c) => c + 1);
  };

  const next = () => {
    if (isLast) {
      const final = correctCount + (selected === q.correctIndex ? 0 : 0);
      setDone(true);
      onComplete(final, questions.length);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  };

  if (done) {
    return (
      <div className="rounded-xl border border-k8s-blue/40 bg-blue-50 p-4 text-center dark:bg-blue-950/30">
        <p className="text-2xl">{correctCount === questions.length ? '🎉' : '📚'}</p>
        <p className="font-bold text-slate-800 dark:text-slate-100">
          {correctCount} / {questions.length} correct
        </p>
        <button
          onClick={() => {
            setDone(false);
            setIndex(0);
            setSelected(null);
            setCorrectCount(0);
          }}
          className="mt-2 text-xs font-semibold text-k8s-blue hover:underline"
        >
          Retake quiz
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Question {index + 1} / {questions.length}
      </p>
      <p className="mb-3 font-medium text-slate-800 dark:text-slate-100">{q.question}</p>
      <div className="flex flex-col gap-2">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correctIndex;
          const isSelected = selected === i;
          let cls = 'border-slate-200 hover:border-k8s-blue dark:border-slate-700';
          if (selected !== null) {
            if (isCorrect) cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30';
            else if (isSelected) cls = 'border-red-500 bg-red-50 dark:bg-red-950/30';
            else cls = 'border-slate-200 opacity-60 dark:border-slate-700';
          }
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              className={`rounded-lg border px-3 py-2 text-left text-sm text-slate-700 transition dark:text-slate-200 ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {selected === q.correctIndex ? '✅ Correct — ' : '❌ Not quite — '}
          {q.explanation}
        </div>
      )}
      {selected !== null && (
        <button
          onClick={next}
          className="mt-3 rounded-lg bg-k8s-blue px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          {isLast ? 'Finish quiz' : 'Next question →'}
        </button>
      )}
    </div>
  );
}
