import { useMemo, useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LessonView } from './components/LessonView';
import { ClusterPanel } from './components/ClusterPanel';
import { lessons, lessonById } from './data/lessons';
import { useCluster } from './hooks/useCluster';
import { useProgress } from './hooks/useProgress';
import { useDarkMode } from './hooks/useDarkMode';

export default function App() {
  const [activeId, setActiveId] = useState(lessons[0].id);
  const [mobilePanel, setMobilePanel] = useState<'lesson' | 'cluster'>('lesson');
  const cluster = useCluster();
  const { progress, markLearned, markChallengeSolved, setQuizScore, resetProgress } = useProgress();
  const { isDark, toggleTheme } = useDarkMode();

  const lesson = lessonById[activeId];
  const completed = useMemo(() => Object.keys(progress.challengeSolved).length, [progress.challengeSolved]);

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header
        completed={completed}
        total={lessons.length}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onResetCluster={() => {
          if (confirm('Wipe the simulated cluster back to empty? Your lesson progress is kept.')) cluster.reset();
        }}
        onResetProgress={() => {
          if (confirm('Reset all learning progress (lessons read, challenges solved, quiz scores)?')) resetProgress();
        }}
      />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 dark:border-slate-800 md:block">
          <Sidebar lessons={lessons} activeId={activeId} onSelect={setActiveId} progress={progress} />
        </aside>

        <main className={`min-h-0 flex-1 overflow-y-auto ${mobilePanel === 'lesson' ? 'block' : 'hidden'} lg:block`}>
          <div className="border-b border-slate-200 px-5 py-2 dark:border-slate-800 md:hidden">
            <select
              value={activeId}
              onChange={(e) => setActiveId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.icon} {l.title}
                </option>
              ))}
            </select>
          </div>
          <LessonView
            lesson={lesson}
            clusterState={cluster.state}
            files={cluster.files}
            onSeedFile={cluster.seedFile}
            onApplyFile={(filename) => cluster.applyYamlText(cluster.files[filename] ?? '', filename)}
            onFileChange={(filename, content) => cluster.seedFile(filename, content)}
            solved={!!progress.challengeSolved[lesson.id]}
            onSolved={() => markChallengeSolved(lesson.id)}
            onQuizComplete={(correct, total) => setQuizScore(lesson.id, correct, total)}
            onOpenLesson={() => markLearned(lesson.id)}
          />
        </main>

        <section
          className={`min-h-0 w-full shrink-0 border-slate-200 dark:border-slate-800 lg:block lg:w-[420px] lg:border-l ${
            mobilePanel === 'cluster' ? 'block' : 'hidden'
          }`}
        >
          <ClusterPanel cluster={cluster} />
        </section>
      </div>

      <nav className="flex border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:hidden">
        <button
          onClick={() => setMobilePanel('lesson')}
          className={`flex-1 py-2.5 text-sm font-semibold ${mobilePanel === 'lesson' ? 'text-k8s-blue' : 'text-slate-400'}`}
        >
          📖 Lesson
        </button>
        <button
          onClick={() => setMobilePanel('cluster')}
          className={`flex-1 py-2.5 text-sm font-semibold ${mobilePanel === 'cluster' ? 'text-k8s-blue' : 'text-slate-400'}`}
        >
          🛰️ Cluster
        </button>
      </nav>
    </div>
  );
}
