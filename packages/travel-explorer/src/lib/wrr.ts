interface WeightedItem<T> {
  key: T;
  weight: number;
}

/**
 * Smooth weighted round-robin (the algorithm nginx uses for upstream balancing).
 * Produces a sequence where each key appears with frequency proportional to its
 * weight, interleaved evenly rather than clumped together.
 */
export function weightedRoundRobin<T extends string>(items: WeightedItem<T>[], n: number): T[] {
  const positive = items.filter((it) => it.weight > 0);
  if (positive.length === 0) {
    return items.length > 0 ? Array(n).fill(items[0].key) : [];
  }
  const state = positive.map((it) => ({ ...it, current: 0 }));
  const total = state.reduce((sum, s) => sum + s.weight, 0);
  const result: T[] = [];
  for (let i = 0; i < n; i++) {
    state.forEach((s) => (s.current += s.weight));
    let best = state[0];
    for (const s of state) if (s.current > best.current) best = s;
    result.push(best.key);
    best.current -= total;
  }
  return result;
}
