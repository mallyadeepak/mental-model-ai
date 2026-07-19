import type { Lesson } from '../data/types';
import type { ProgressState } from '../hooks/useProgress';

export function Sidebar({
  lessons,
  activeId,
  onSelect,
  progress,
}: {
  lessons: Lesson[];
  activeId: string;
  onSelect: (id: string) => void;
  progress: ProgressState;
}) {
  const categories: string[] = [];
  lessons.forEach((l) => {
    if (!categories.includes(l.category)) categories.push(l.category);
  });

  return (
    <nav className="flex h-full flex-col gap-4 overflow-y-auto px-3 py-4">
      {categories.map((cat) => (
        <div key={cat}>
          <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{cat}</p>
          <div className="flex flex-col gap-0.5">
            {lessons
              .filter((l) => l.category === cat)
              .map((l) => {
                const active = l.id === activeId;
                const solved = progress.challengeSolved[l.id];
                const learned = progress.learned[l.id];
                return (
                  <button
                    key={l.id}
                    onClick={() => onSelect(l.id)}
                    className={`flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
                      active
                        ? 'bg-k8s-blue text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-base leading-none">{l.icon}</span>
                    <span className="flex-1 truncate">{l.title}</span>
                    {solved ? (
                      <span title="Challenge solved" className="text-xs">✅</span>
                    ) : learned ? (
                      <span title="Read" className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      ) : null}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </nav>
  );
}
