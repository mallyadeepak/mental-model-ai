// All data lives in localStorage, on this device, in this browser. Nothing
// here ever leaves the machine — there is no server, no network call, no
// account. That's a deliberate choice: worries, problems, and gratitude
// entries are personal, and the tool should never become one more place
// they get collected.

const STORAGE_KEY = 'vantage:entries:v1';
const LEGACY_KEY = 'worry-compass:entries:v1';

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function migrateLegacy() {
  try {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return;
    const parsed = JSON.parse(legacy);
    if (!Array.isArray(parsed) || !parsed.length) return;
    const migrated = parsed.map((e) => ({
      ...e,
      kind: e.kind || 'worry',
      text: e.text ?? e.worryText,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  } catch {
    // Legacy data was malformed — start fresh rather than block the app.
  }
}
migrateLegacy();

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// A "problem" entry is always something to act on; a "worry" entry only is
// once it's been routed down the action fork (as opposed to released).
// Gratitude entries never carry a follow-up.
export function isActionable(entry) {
  return entry.kind === 'problem' || (entry.kind === 'worry' && entry.path === 'action');
}

export function getEntries() {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getEntry(id) {
  return readAll().find((e) => e.id === id) || null;
}

export function createEntry(data) {
  const entries = readAll();
  const entry = {
    id: uid(),
    createdAt: new Date().toISOString(),
    status: 'open',
    ...data,
  };
  entries.push(entry);
  writeAll(entries);
  return entry;
}

export function updateEntry(id, updates) {
  const entries = readAll();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  entries[idx] = { ...entries[idx], ...updates };
  writeAll(entries);
  return entries[idx];
}

export function deleteEntry(id) {
  writeAll(readAll().filter((e) => e.id !== id));
}

export function exportData() {
  return JSON.stringify(readAll(), null, 2);
}

export function clearAll() {
  writeAll([]);
}

function localDateString(isoString) {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function computeStats() {
  const entries = readAll();
  const total = entries.length;

  const worryCount = entries.filter((e) => e.kind === 'worry').length;
  const problemCount = entries.filter((e) => e.kind === 'problem').length;
  const gratitudeEntries = entries.filter((e) => e.kind === 'gratitude');
  const gratitudeCount = gratitudeEntries.length;
  const gratitudeItemCount = gratitudeEntries.reduce((sum, e) => sum + (e.gratitudeItems?.length || 0), 0);
  const releasedCount = entries.filter((e) => e.kind === 'worry' && e.path === 'release').length;

  const actionable = entries.filter(isActionable);
  const completed = actionable.filter((e) => e.status === 'done');
  const openFollowUps = actionable.filter((e) => e.status === 'open');

  const confidenceDeltas = completed
    .filter((e) => typeof e.confidenceBefore === 'number' && typeof e.confidenceAfter === 'number')
    .map((e) => e.confidenceAfter - e.confidenceBefore);
  const avgConfidenceDelta = confidenceDeltas.length
    ? confidenceDeltas.reduce((a, b) => a + b, 0) / confidenceDeltas.length
    : null;

  const recentGratitude = [...gratitudeEntries]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  return {
    total,
    worryCount,
    problemCount,
    gratitudeCount,
    gratitudeItemCount,
    releasedCount,
    completedCount: completed.length,
    openFollowUps,
    completedEntries: completed,
    avgConfidenceDelta,
    recentGratitude,
  };
}

export function computeStreak() {
  const entries = readAll();
  const dateSet = new Set(entries.map((e) => localDateString(e.createdAt)));
  if (dateSet.size === 0) return 0;

  const today = new Date();
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayStr = localDateString(cursor.toISOString());

  // If nothing logged yet today, streak counting starts from yesterday so a
  // streak isn't zeroed out the moment a new day begins.
  if (!dateSet.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (dateSet.has(localDateString(cursor.toISOString()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function last7DaysActivity() {
  const entries = readAll();
  const dateSet = new Set(entries.map((e) => localDateString(e.createdAt)));
  const days = [];
  const cursor = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() - i);
    const key = localDateString(d.toISOString());
    days.push({
      label: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
      date: key,
      active: dateSet.has(key),
      isToday: i === 0,
    });
  }
  return days;
}
