// Small hand-rolled SVG chart helpers. No charting library — the whole app
// stays dependency-free so it can run by just opening index.html.

const TAU = Math.PI * 2;

function polarPoint(cx, cy, r, angle) {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function arcPath(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const [x1, y1] = polarPoint(cx, cy, rOuter, startAngle);
  const [x2, y2] = polarPoint(cx, cy, rOuter, endAngle);
  const [x3, y3] = polarPoint(cx, cy, rInner, endAngle);
  const [x4, y4] = polarPoint(cx, cy, rInner, startAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${x1} ${y1}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4}`,
    'Z',
  ].join(' ');
}

// Renders a two-series donut (action vs release) with a hero number in the
// center and a gap between segments per dataviz mark spacing rules.
export function renderRatioDonut({ actionCount, releaseCount }) {
  const total = actionCount + releaseCount;
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 70;
  const rInner = 46;
  const gapRad = total > 0 ? 0.035 : 0; // ~2px visual gap between segments

  if (total === 0) {
    return `
      <svg viewBox="0 0 ${size} ${size}" class="donut" role="img" aria-label="No entries yet">
        <circle cx="${cx}" cy="${cy}" r="${(rOuter + rInner) / 2}" fill="none"
          stroke="var(--gridline)" stroke-width="${rOuter - rInner}"/>
        <text x="${cx}" y="${cy}" class="donut-hero" text-anchor="middle" dominant-baseline="central">0</text>
      </svg>`;
  }

  const actionFrac = actionCount / total;
  const startAngle = -Math.PI / 2;
  const actionEnd = startAngle + actionFrac * TAU;

  let segments = '';
  if (actionCount > 0) {
    segments += `<path d="${arcPath(cx, cy, rOuter, rInner, startAngle + gapRad / 2, actionEnd - (releaseCount > 0 ? gapRad / 2 : -gapRad / 2))}"
      fill="var(--series-action)"><title>Turned into action: ${actionCount}</title></path>`;
  }
  if (releaseCount > 0) {
    segments += `<path d="${arcPath(cx, cy, rOuter, rInner, actionEnd + (actionCount > 0 ? gapRad / 2 : -gapRad / 2), startAngle + TAU - gapRad / 2)}"
      fill="var(--series-release)"><title>Released: ${releaseCount}</title></path>`;
  }

  return `
    <svg viewBox="0 0 ${size} ${size}" class="donut" role="img" aria-label="${actionCount} turned into action, ${releaseCount} released">
      ${segments}
      <text x="${cx}" y="${cy - 6}" class="donut-hero" text-anchor="middle" dominant-baseline="central">${total}</text>
      <text x="${cx}" y="${cy + 16}" class="donut-hero-label" text-anchor="middle" dominant-baseline="central">total</text>
    </svg>`;
}

// A 7-cell weekly activity strip — not a "chart" so much as a status row,
// styled with the status/muted ink tokens rather than a categorical hue.
export function renderWeekStrip(days) {
  return `
    <div class="week-strip" role="img" aria-label="Practice activity over the last 7 days">
      ${days
        .map(
          (d) => `
        <div class="week-cell ${d.active ? 'is-active' : ''} ${d.isToday ? 'is-today' : ''}" title="${d.date}${d.active ? ' — practiced' : ''}">
          <span class="week-cell-dot"></span>
          <span class="week-cell-label">${d.label}</span>
        </div>`
        )
        .join('')}
    </div>`;
}
