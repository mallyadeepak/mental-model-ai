import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Lesson } from '../data/types';
import { ConceptDiagram } from './ConceptDiagram';
import { YamlPanel } from './YamlPanel';
import { ChallengePanel } from './ChallengePanel';
import { Quiz } from './Quiz';
import type { ClusterState } from '../engine/types';

type Tab = 'learn' | 'manifest' | 'challenge' | 'quiz';

export function LessonView({
  lesson,
  clusterState,
  files,
  onSeedFile,
  onApplyFile,
  onFileChange,
  solved,
  onSolved,
  onQuizComplete,
  onOpenLesson,
}: {
  lesson: Lesson;
  clusterState: ClusterState;
  files: Record<string, string>;
  onSeedFile: (filename: string, content: string) => void;
  onApplyFile: (filename: string) => { applied: { kind: string; name: string; action: string }[]; errors: string[] };
  onFileChange: (filename: string, content: string) => void;
  solved: boolean;
  onSolved: () => void;
  onQuizComplete: (correct: number, total: number) => void;
  onOpenLesson: () => void;
}) {
  const [tab, setTab] = useState<Tab>('learn');

  useEffect(() => {
    setTab('learn');
    onOpenLesson();
    onSeedFile(lesson.yamlFilename, lesson.yaml);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'learn', label: '📖 Learn' },
    { id: 'manifest', label: '📄 Manifest' },
    { id: 'challenge', label: '🎯 Challenge' },
    { id: 'quiz', label: '❓ Quiz' },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-k8s-blue">{lesson.category}</p>
        <h2 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-50">
          {lesson.icon} {lesson.title}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{lesson.tagline}</p>
      </div>

      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
              tab === t.id
                ? 'border-k8s-blue text-k8s-blue'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'learn' && (
        <div className="flex flex-col gap-5">
          <div className="prose-k8s max-w-none text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <ReactMarkdown>{lesson.explanation}</ReactMarkdown>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">Mental model</h3>
            <ConceptDiagram nodes={lesson.diagram.nodes} edges={lesson.diagram.edges} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">Key terms</h3>
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {lesson.keyTerms.map((t) => (
                <div key={t.term} className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900">
                  <dt className="text-xs font-bold text-k8s-blue">{t.term}</dt>
                  <dd className="text-xs text-slate-600 dark:text-slate-400">{t.definition}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {tab === 'manifest' && (
        <YamlPanel
          filename={lesson.yamlFilename}
          value={files[lesson.yamlFilename] ?? lesson.yaml}
          onChange={(v) => onFileChange(lesson.yamlFilename, v)}
          onApply={() => onApplyFile(lesson.yamlFilename)}
          notes={lesson.yamlNotes}
        />
      )}

      {tab === 'challenge' && (
        <ChallengePanel challenge={lesson.challenge} state={clusterState} solved={solved} onSolved={onSolved} />
      )}

      {tab === 'quiz' && <Quiz questions={lesson.quiz} onComplete={onQuizComplete} />}
    </div>
  );
}
