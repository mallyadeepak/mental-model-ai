import type { InterestKey, InterestWeights } from '../../types';

const LABELS: Record<InterestKey, { label: string; emoji: string }> = {
  cafeCulture: { label: 'Café culture', emoji: '☕' },
  nightlifeSocial: { label: 'Nightlife & meeting people', emoji: '🍸' },
  foodie: { label: 'Food', emoji: '🍽️' },
  outdoors: { label: 'Outdoors & activities', emoji: '🥾' },
  cultureHistory: { label: 'Culture & history', emoji: '🏛️' },
};

interface WeightSlidersProps {
  weights: InterestWeights;
  onChange: (weights: InterestWeights) => void;
}

export function WeightSliders({ weights, onChange }: WeightSlidersProps) {
  const keys = Object.keys(LABELS) as InterestKey[];

  return (
    <div className="flex flex-col gap-3">
      {keys.map((key) => (
        <label key={key} className="flex items-center gap-3 text-sm">
          <span className="flex w-52 shrink-0 items-center gap-1.5 text-ink-700 dark:text-ink-200">
            <span>{LABELS[key].emoji}</span> {LABELS[key].label}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={weights[key]}
            onChange={(e) => onChange({ ...weights, [key]: Number(e.target.value) })}
            className="flex-1 accent-sunset-500"
          />
          <span className="w-9 text-right text-xs font-medium text-ink-500 dark:text-ink-400">
            {weights[key]}
          </span>
        </label>
      ))}
    </div>
  );
}
