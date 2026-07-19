interface ChipProps {
  label: string;
  emoji?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Chip({ label, emoji, active, onClick, className = '' }: ChipProps) {
  const base =
    'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors border';
  const activeClasses = active
    ? 'bg-sunset-500 border-sunset-500 text-white'
    : 'bg-white border-ink-200 text-ink-700 hover:border-sunset-300 dark:bg-ink-900 dark:border-ink-700 dark:text-ink-200 dark:hover:border-sunset-400';

  if (!onClick) {
    return (
      <span className={`${base} ${activeClasses} ${className} cursor-default`}>
        {emoji && <span>{emoji}</span>}
        {label}
      </span>
    );
  }

  return (
    <button type="button" onClick={onClick} className={`${base} ${activeClasses} ${className}`}>
      {emoji && <span>{emoji}</span>}
      {label}
    </button>
  );
}
