import type { BlockCategory, ItineraryDay } from '../../types';

const CATEGORY_ICON: Record<BlockCategory, string> = {
  explore: '🚶',
  cafe: '☕',
  food: '🍽️',
  social: '🤝',
  bar: '🍸',
  culture: '🏛️',
  rest: '🛌',
  outdoors: '🥾',
};

export function DayCard({ day }: { day: ItineraryDay }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">
          Day {day.day}
        </h3>
        <span className="text-xs text-ink-500 dark:text-ink-400">{day.theme}</span>
      </div>
      <ol className="flex flex-col gap-3">
        {day.blocks.map((block) => (
          <li key={`${block.timeOfDay}-${block.title}`} className="flex gap-3">
            <div className="flex w-20 shrink-0 flex-col items-start">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                {block.timeOfDay}
              </span>
              <span className="text-lg">{CATEGORY_ICON[block.category]}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-900 dark:text-white">{block.title}</p>
              <p className="text-sm text-ink-600 dark:text-ink-300">{block.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
