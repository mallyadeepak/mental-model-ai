import type { City } from '../../types';

export function MeetPeopleTab({ city }: { city: City }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-600 dark:text-ink-300">
        The lowest-effort ways to turn a solo day into a social one in {city.name}.
      </p>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {city.meetPeople.map((idea) => (
          <li
            key={idea.activity}
            className="rounded-xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-900 dark:bg-teal-950/40"
          >
            <h3 className="font-display text-sm font-semibold text-teal-800 dark:text-teal-300">
              {idea.activity}
            </h3>
            <p className="mt-1 text-sm text-ink-700 dark:text-ink-200">{idea.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
