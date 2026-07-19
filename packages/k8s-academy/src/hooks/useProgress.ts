import { useCallback, useEffect, useState } from 'react';

const KEY = 'k8s-academy-progress-v1';

export interface ProgressState {
  learned: Record<string, boolean>;
  challengeSolved: Record<string, boolean>;
  quizScore: Record<string, { correct: number; total: number }>;
}

function load(): ProgressState {
  if (typeof window === 'undefined') return { learned: {}, challengeSolved: {}, quizScore: {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupted storage
  }
  return { learned: {}, challengeSolved: {}, quizScore: {} };
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressState>(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(progress));
  }, [progress]);

  const markLearned = useCallback((lessonId: string) => {
    setProgress((p) => ({ ...p, learned: { ...p.learned, [lessonId]: true } }));
  }, []);

  const markChallengeSolved = useCallback((lessonId: string) => {
    setProgress((p) => ({ ...p, challengeSolved: { ...p.challengeSolved, [lessonId]: true } }));
  }, []);

  const setQuizScore = useCallback((lessonId: string, correct: number, total: number) => {
    setProgress((p) => ({ ...p, quizScore: { ...p.quizScore, [lessonId]: { correct, total } } }));
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({ learned: {}, challengeSolved: {}, quizScore: {} });
  }, []);

  return { progress, markLearned, markChallengeSolved, setQuizScore, resetProgress };
}
