export function Header({
  completed,
  total,
  isDark,
  onToggleTheme,
  onResetCluster,
  onResetProgress,
}: {
  completed: number;
  total: number;
  isDark: boolean;
  onToggleTheme: () => void;
  onResetCluster: () => void;
  onResetProgress: () => void;
}) {
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-2.5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex items-center gap-2.5">
        <span className="text-2xl">⚓️</span>
        <div>
          <h1 className="text-sm font-bold leading-tight text-slate-800 dark:text-slate-100">K8s Academy</h1>
          <p className="text-[11px] leading-tight text-slate-400">Learn Kubernetes by doing</p>
        </div>
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        <div className="h-1.5 w-36 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full rounded-full bg-k8s-blue transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {completed}/{total} modules
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onResetProgress}
          title="Reset learning progress"
          className="rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Reset progress
        </button>
        <button
          onClick={onResetCluster}
          title="Wipe the simulated cluster back to empty"
          className="rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Reset cluster
        </button>
        <button
          onClick={onToggleTheme}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          title="Toggle theme"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
