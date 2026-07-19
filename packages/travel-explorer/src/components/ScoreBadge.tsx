interface ScoreBadgeProps {
  label: string;
  value: number;
  max?: number;
}

export function ScoreBadge({ label, value, max = 10 }: ScoreBadgeProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = pct >= 80 ? 'bg-teal-500' : pct >= 55 ? 'bg-sunset-400' : 'bg-ink-400';

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 shrink-0 text-ink-500 dark:text-ink-400">{label}</span>
      <div className="h-1.5 flex-1 rounded-full bg-ink-100 dark:bg-ink-800">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right font-semibold text-ink-700 dark:text-ink-200">
        {value.toFixed(1)}
      </span>
    </div>
  );
}
