import { DISTORTIONS } from './distortions.js';
import {
  createEntry,
  updateEntry,
  deleteEntry,
  getEntries,
  computeStats,
  computeStreak,
  last7DaysActivity,
} from './storage.js';
import { renderRatioDonut, renderWeekStrip } from './charts.js';

const modalRoot = document.getElementById('modal-root');

/* ---------------------------------------------------------------------- */
/* Tabs                                                                    */
/* ---------------------------------------------------------------------- */

function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabButtons.forEach((b) => b.classList.toggle('is-active', b === btn));
      panels.forEach((p) => p.classList.toggle('is-active', p.id === `tab-${target}`));
      if (target === 'history') renderHistory();
      if (target === 'dashboard') renderDashboard();
    });
  });
}

/* ---------------------------------------------------------------------- */
/* Modal                                                                   */
/* ---------------------------------------------------------------------- */

function openModal(html) {
  modalRoot.innerHTML = `<div class="modal-backdrop" data-action="close-modal"><div class="modal" role="dialog">${html}</div></div>`;
  modalRoot.classList.add('is-open');
}

function closeModal() {
  modalRoot.classList.remove('is-open');
  modalRoot.innerHTML = '';
}

modalRoot.addEventListener('click', (e) => {
  if (e.target.dataset.action === 'close-modal') closeModal();
});

/* ---------------------------------------------------------------------- */
/* New Entry wizard                                                        */
/* ---------------------------------------------------------------------- */

const wizardRoot = document.getElementById('wizard-root');

function freshWizardState() {
  return {
    step: 'capture',
    worryText: '',
    selectedDistortions: [],
    reframedThought: '',
    path: null,
    problemStatement: '',
    brainstorm: [''],
    chosenAction: '',
    chosenReason: '',
    nextStep: '',
    whenWhere: '',
    confidenceBefore: 5,
    inControl: '',
    outControl: '',
    worryTimeDate: '',
    savedEntry: null,
  };
}

let wizard = freshWizardState();

const STEP_ORDER = {
  capture: null,
  distortions: 'capture',
  fork: 'distortions',
  'action-1': 'fork',
  'action-2': 'action-1',
  'action-3': 'action-2',
  'release-1': 'fork',
  'release-2': 'release-1',
};

const PROGRESS_STEPS = ['capture', 'distortions', 'fork', 'path', 'done'];

function progressIndex() {
  if (wizard.step === 'done') return 4;
  if (wizard.step.startsWith('action') || wizard.step.startsWith('release')) return 3;
  return PROGRESS_STEPS.indexOf(wizard.step);
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function renderProgress() {
  const idx = progressIndex();
  return `
    <div class="wizard-progress" aria-hidden="true">
      ${PROGRESS_STEPS.map((_, i) => `<span class="progress-dot ${i <= idx ? 'is-filled' : ''}"></span>`).join('')}
    </div>`;
}

function renderWizard() {
  let body = '';
  switch (wizard.step) {
    case 'capture': body = stepCapture(); break;
    case 'distortions': body = stepDistortions(); break;
    case 'fork': body = stepFork(); break;
    case 'action-1': body = stepAction1(); break;
    case 'action-2': body = stepAction2(); break;
    case 'action-3': body = stepAction3(); break;
    case 'release-1': body = stepRelease1(); break;
    case 'release-2': body = stepRelease2(); break;
    case 'done': body = stepDone(); break;
    default: body = stepCapture();
  }
  wizardRoot.innerHTML = `${wizard.step === 'done' ? '' : renderProgress()}${body}`;
  wizardRoot.querySelector('textarea, input')?.focus();
}

function stepCapture() {
  return `
    <div class="wizard-step">
      <h2>What's weighing on your mind?</h2>
      <p class="step-hint">Write it exactly as it feels — messy is fine. You'll shape it in the next steps.</p>
      <textarea data-field="worryText" rows="5" placeholder="I'm worried that…">${escapeHtml(wizard.worryText)}</textarea>
      <div class="wizard-actions">
        <button class="btn btn-primary" data-action="to-distortions">Continue</button>
      </div>
    </div>`;
}

function stepDistortions() {
  const checks = DISTORTIONS.map((d) => `
    <label class="distortion-item">
      <input type="checkbox" data-distortion="${d.id}" ${wizard.selectedDistortions.includes(d.id) ? 'checked' : ''} />
      <span>
        <strong>${d.name}</strong>
        <small>${d.description}</small>
      </span>
    </label>`).join('');

  return `
    <div class="wizard-step">
      <h2>Does the thought lean on a familiar pattern?</h2>
      <p class="step-hint">Worry often exaggerates through a handful of common thinking habits. Check any that fit — or skip this if none do.</p>
      <div class="distortion-grid">${checks}</div>
      <label class="field-label" for="reframe-input">Optional: write a more balanced version of the thought</label>
      <textarea id="reframe-input" data-field="reframedThought" rows="3" placeholder="A steadier way to put it might be…">${escapeHtml(wizard.reframedThought)}</textarea>
      <div class="wizard-actions">
        <button class="btn btn-ghost" data-action="back">Back</button>
        <button class="btn btn-primary" data-action="to-fork">Continue</button>
      </div>
    </div>`;
}

function stepFork() {
  return `
    <div class="wizard-step">
      <h2>Is there something you can actually do?</h2>
      <p class="step-hint">Ask yourself: is there a concrete action <em>you</em> could take — starting today or this week — that would influence this? Or is it outside your control, or a hypothetical "what if"?</p>
      <div class="fork-buttons">
        <button class="btn btn-fork btn-fork-action" data-action="choose-action">
          <strong>Yes — I can act</strong>
          <span>Turn it into a plan</span>
        </button>
        <button class="btn btn-fork btn-fork-release" data-action="choose-release">
          <strong>No — not actionable</strong>
          <span>Practice letting it go</span>
        </button>
      </div>
      <details class="fork-help">
        <summary>Still not sure?</summary>
        <ul>
          <li>Will this matter in five years — or even five days?</li>
          <li>What part of this is within your control, and what part isn't?</li>
          <li>Is there a real deadline, or is this a hypothetical spiral?</li>
        </ul>
      </details>
      <div class="wizard-actions">
        <button class="btn btn-ghost" data-action="back">Back</button>
      </div>
    </div>`;
}

/* -- Action path: Problem-Solving Therapy (D'Zurilla & Nezu) -- */

function stepAction1() {
  const ideas = wizard.brainstorm
    .map((val, i) => `<input type="text" data-field="brainstorm.${i}" value="${escapeHtml(val)}" placeholder="Idea ${i + 1}" />`)
    .join('');
  return `
    <div class="wizard-step">
      <h2>Define the problem, then brainstorm</h2>
      <label class="field-label" for="problem-input">State the problem in one specific sentence</label>
      <textarea id="problem-input" data-field="problemStatement" rows="2" placeholder="The actual problem is…">${escapeHtml(wizard.problemStatement)}</textarea>
      <label class="field-label">Brainstorm possible actions — aim for at least 3, don't filter yet</label>
      <div class="brainstorm-list">${ideas}</div>
      <button class="btn btn-ghost btn-small" data-action="add-idea">+ Add another idea</button>
      <div class="wizard-actions">
        <button class="btn btn-ghost" data-action="back">Back</button>
        <button class="btn btn-primary" data-action="to-action-2">Continue</button>
      </div>
    </div>`;
}

function stepAction2() {
  return `
    <div class="wizard-step">
      <h2>Choose one, and make it concrete</h2>
      <label class="field-label" for="chosen-action">Which option will you try?</label>
      <input id="chosen-action" type="text" data-field="chosenAction" value="${escapeHtml(wizard.chosenAction)}" placeholder="I'll try…" />
      <label class="field-label" for="chosen-reason">Why this one?</label>
      <textarea id="chosen-reason" data-field="chosenReason" rows="2" placeholder="It's the most realistic first move because…">${escapeHtml(wizard.chosenReason)}</textarea>
      <label class="field-label" for="next-step">What's the very next tiny step?</label>
      <input id="next-step" type="text" data-field="nextStep" value="${escapeHtml(wizard.nextStep)}" placeholder="The first 10-minute action" />
      <label class="field-label" for="when-where">When and where will you do it?</label>
      <input id="when-where" type="text" data-field="whenWhere" value="${escapeHtml(wizard.whenWhere)}" placeholder="e.g. Tomorrow, 9am, at my desk" />
      <div class="wizard-actions">
        <button class="btn btn-ghost" data-action="back">Back</button>
        <button class="btn btn-primary" data-action="to-action-3">Continue</button>
      </div>
    </div>`;
}

function stepAction3() {
  return `
    <div class="wizard-step">
      <h2>One last check-in</h2>
      <label class="field-label" for="confidence-before">How confident do you feel about handling this now? (${wizard.confidenceBefore}/10)</label>
      <input id="confidence-before" type="range" min="0" max="10" value="${wizard.confidenceBefore}" data-field="confidenceBefore" />
      <p class="step-hint">You'll see this again once you follow through — that comparison is where confidence actually gets built.</p>
      <div class="wizard-actions">
        <button class="btn btn-ghost" data-action="back">Back</button>
        <button class="btn btn-primary" data-action="finish-action">Save plan</button>
      </div>
    </div>`;
}

/* -- Release path: acceptance / defusion / worry-time postponement -- */

function stepRelease1() {
  return `
    <div class="wizard-step">
      <h2>That's a reasonable thing to notice</h2>
      <p class="step-hint">Not every worry needs solving right now — some just need to be named and set down. What's actually within your control here, and what isn't?</p>
      <label class="field-label" for="in-control">Within your control</label>
      <textarea id="in-control" data-field="inControl" rows="2" placeholder="Optional">${escapeHtml(wizard.inControl)}</textarea>
      <label class="field-label" for="out-control">Not within your control</label>
      <textarea id="out-control" data-field="outControl" rows="2" placeholder="Optional">${escapeHtml(wizard.outControl)}</textarea>
      <div class="wizard-actions">
        <button class="btn btn-ghost" data-action="back">Back</button>
        <button class="btn btn-primary" data-action="to-release-2">Continue</button>
      </div>
    </div>`;
}

function stepRelease2() {
  return `
    <div class="wizard-step">
      <h2>Set it down</h2>
      <label class="field-label" for="worry-time">If it would ever be useful to revisit this, when? <span class="optional-tag">optional</span></label>
      <input id="worry-time" type="date" data-field="worryTimeDate" value="${escapeHtml(wizard.worryTimeDate)}" />
      <p class="step-hint">This isn't suppression — it's choosing when, if ever, to spend attention on it. Right now you're choosing not to.</p>
      <div class="wizard-actions">
        <button class="btn btn-ghost" data-action="back">Back</button>
        <button class="btn btn-primary btn-release" data-action="finish-release">Let it go</button>
      </div>
    </div>`;
}

function stepDone() {
  const isAction = wizard.savedEntry?.path === 'action';
  return `
    <div class="wizard-step wizard-done">
      <div class="done-icon">${isAction ? '🎯' : '🕊️'}</div>
      <h2>${isAction ? 'Plan saved.' : 'Released.'}</h2>
      <p class="step-hint">
        ${isAction
          ? `Your next step — "${escapeHtml(wizard.nextStep)}" — is waiting in your Dashboard follow-ups. Come back and log what happened; that's how the evidence bank grows.`
          : `You chose not to carry this one right now. That's a skill, not avoidance — and it gets easier with practice.`}
      </p>
      <div class="wizard-actions">
        <button class="btn btn-primary" data-action="new-entry">Start another entry</button>
      </div>
    </div>`;
}

function goToStep(step) {
  wizard.step = step;
  renderWizard();
}

wizardRoot.addEventListener('input', (e) => {
  const field = e.target.dataset.field;
  if (!field) return;
  if (field.startsWith('brainstorm.')) {
    const idx = Number(field.split('.')[1]);
    wizard.brainstorm[idx] = e.target.value;
  } else if (field === 'confidenceBefore') {
    wizard.confidenceBefore = Number(e.target.value);
    const label = wizardRoot.querySelector('label[for="confidence-before"]');
    if (label) label.textContent = `How confident do you feel about handling this now? (${wizard.confidenceBefore}/10)`;
  } else {
    wizard[field] = e.target.value;
  }
});

wizardRoot.addEventListener('change', (e) => {
  if (e.target.dataset.distortion) {
    const id = e.target.dataset.distortion;
    if (e.target.checked) {
      if (!wizard.selectedDistortions.includes(id)) wizard.selectedDistortions.push(id);
    } else {
      wizard.selectedDistortions = wizard.selectedDistortions.filter((d) => d !== id);
    }
  }
});

wizardRoot.addEventListener('click', (e) => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (!action) return;

  switch (action) {
    case 'to-distortions':
      if (!wizard.worryText.trim()) return;
      goToStep('distortions');
      break;
    case 'to-fork':
      goToStep('fork');
      break;
    case 'choose-action':
      wizard.path = 'action';
      goToStep('action-1');
      break;
    case 'choose-release':
      wizard.path = 'release';
      goToStep('release-1');
      break;
    case 'add-idea':
      wizard.brainstorm.push('');
      renderWizard();
      break;
    case 'to-action-2':
      if (!wizard.problemStatement.trim()) return;
      goToStep('action-2');
      break;
    case 'to-action-3':
      if (!wizard.chosenAction.trim() || !wizard.nextStep.trim()) return;
      goToStep('action-3');
      break;
    case 'to-release-2':
      goToStep('release-2');
      break;
    case 'back': {
      const prev = STEP_ORDER[wizard.step];
      if (prev) goToStep(prev);
      break;
    }
    case 'finish-action': {
      const entry = createEntry({
        worryText: wizard.worryText,
        distortions: wizard.selectedDistortions,
        reframedThought: wizard.reframedThought,
        path: 'action',
        problemStatement: wizard.problemStatement,
        brainstorm: wizard.brainstorm.filter((s) => s.trim()),
        chosenAction: wizard.chosenAction,
        chosenReason: wizard.chosenReason,
        nextStep: wizard.nextStep,
        whenWhere: wizard.whenWhere,
        confidenceBefore: wizard.confidenceBefore,
        status: 'open',
      });
      wizard.savedEntry = entry;
      goToStep('done');
      break;
    }
    case 'finish-release': {
      const entry = createEntry({
        worryText: wizard.worryText,
        distortions: wizard.selectedDistortions,
        reframedThought: wizard.reframedThought,
        path: 'release',
        inControl: wizard.inControl,
        outControl: wizard.outControl,
        worryTimeDate: wizard.worryTimeDate,
        status: 'done',
      });
      wizard.savedEntry = entry;
      goToStep('done');
      break;
    }
    case 'new-entry':
      wizard = freshWizardState();
      renderWizard();
      break;
  }
});

/* ---------------------------------------------------------------------- */
/* History                                                                  */
/* ---------------------------------------------------------------------- */

let historyFilter = 'all';

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function distortionNames(ids) {
  return ids?.map((id) => DISTORTIONS.find((d) => d.id === id)?.name).filter(Boolean).join(', ') || '';
}

function entryCardHtml(entry) {
  const pathLabel = entry.path === 'action' ? 'Turned into action' : 'Released';
  const pathClass = entry.path === 'action' ? 'tag-action' : 'tag-release';
  const statusBadge = entry.path === 'action'
    ? `<span class="tag ${entry.status === 'done' ? 'tag-done' : 'tag-open'}">${entry.status === 'done' ? 'Completed' : 'Follow-up open'}</span>`
    : '';

  const extra = entry.path === 'action'
    ? `
      <div class="entry-detail"><strong>Problem:</strong> ${escapeHtml(entry.problemStatement)}</div>
      <div class="entry-detail"><strong>Chosen action:</strong> ${escapeHtml(entry.chosenAction)}</div>
      <div class="entry-detail"><strong>Next step:</strong> ${escapeHtml(entry.nextStep)} ${entry.whenWhere ? `(${escapeHtml(entry.whenWhere)})` : ''}</div>
      ${entry.status === 'done'
        ? `<div class="entry-detail"><strong>Outcome:</strong> ${escapeHtml(entry.outcome)}</div>
           <div class="entry-detail"><strong>Confidence:</strong> ${entry.confidenceBefore} → ${entry.confidenceAfter}</div>`
        : `<button class="btn btn-primary btn-small" data-action="complete" data-id="${entry.id}">Mark complete</button>`}
    `
    : `
      ${entry.inControl ? `<div class="entry-detail"><strong>Within control:</strong> ${escapeHtml(entry.inControl)}</div>` : ''}
      ${entry.outControl ? `<div class="entry-detail"><strong>Not within control:</strong> ${escapeHtml(entry.outControl)}</div>` : ''}
      ${entry.worryTimeDate ? `<div class="entry-detail"><strong>Revisit on:</strong> ${entry.worryTimeDate}</div>` : ''}
    `;

  return `
    <article class="entry-card">
      <div class="entry-card-head">
        <span class="tag ${pathClass}">${pathLabel}</span>
        ${statusBadge}
        <time>${formatDate(entry.createdAt)}</time>
      </div>
      <p class="entry-worry">${escapeHtml(entry.worryText)}</p>
      ${entry.reframedThought ? `<p class="entry-reframe">Reframed: "${escapeHtml(entry.reframedThought)}"</p>` : ''}
      ${entry.distortions?.length ? `<p class="entry-distortions">Patterns noticed: ${distortionNames(entry.distortions)}</p>` : ''}
      ${extra}
      <div class="entry-card-foot">
        <button class="btn btn-ghost btn-small" data-action="delete" data-id="${entry.id}">Delete</button>
      </div>
    </article>`;
}

function renderHistory() {
  const listEl = document.getElementById('history-list');
  const emptyEl = document.getElementById('history-empty');
  let entries = getEntries();

  if (historyFilter === 'action') entries = entries.filter((e) => e.path === 'action');
  if (historyFilter === 'release') entries = entries.filter((e) => e.path === 'release');
  if (historyFilter === 'pending') entries = entries.filter((e) => e.path === 'action' && e.status === 'open');

  if (entries.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('is-hidden');
  } else {
    emptyEl.classList.add('is-hidden');
    listEl.innerHTML = entries.map(entryCardHtml).join('');
  }
}

document.querySelectorAll('.history-filter').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.history-filter').forEach((b) => b.classList.toggle('is-active', b === btn));
    historyFilter = btn.dataset.filter;
    renderHistory();
  });
});

document.getElementById('history-list').addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  const id = target.dataset.id;
  if (target.dataset.action === 'delete') {
    if (confirm('Delete this entry? This cannot be undone.')) {
      deleteEntry(id);
      renderHistory();
    }
  } else if (target.dataset.action === 'complete') {
    openCompleteModal(id);
  }
});

function openCompleteModal(id) {
  openModal(`
    <h2>How did it go?</h2>
    <label class="field-label" for="modal-outcome">What happened?</label>
    <textarea id="modal-outcome" rows="3" placeholder="I followed through and…"></textarea>
    <label class="field-label" for="modal-confidence">Confidence now (0–10)</label>
    <input id="modal-confidence" type="range" min="0" max="10" value="7" />
    <div class="wizard-actions">
      <button class="btn btn-ghost" data-action="close-modal">Cancel</button>
      <button class="btn btn-primary" data-action="save-complete" data-id="${id}">Save</button>
    </div>
  `);
  modalRoot.querySelector('[data-action="save-complete"]').addEventListener('click', () => {
    const outcome = document.getElementById('modal-outcome').value;
    const confidenceAfter = Number(document.getElementById('modal-confidence').value);
    updateEntry(id, { status: 'done', outcome, confidenceAfter, completedAt: new Date().toISOString() });
    closeModal();
    renderHistory();
    renderDashboard();
  });
}

/* ---------------------------------------------------------------------- */
/* Dashboard                                                                */
/* ---------------------------------------------------------------------- */

function renderDashboard() {
  const stats = computeStats();
  const streak = computeStreak();
  const week = last7DaysActivity();

  document.getElementById('stat-total').textContent = stats.total;
  document.getElementById('stat-streak').textContent = streak;
  document.getElementById('stat-completed').textContent = stats.completedCount;
  document.getElementById('stat-confidence-delta').textContent =
    stats.avgConfidenceDelta === null ? '—' : `${stats.avgConfidenceDelta >= 0 ? '+' : ''}${stats.avgConfidenceDelta.toFixed(1)}`;

  document.getElementById('week-strip-root').innerHTML = renderWeekStrip(week);
  document.getElementById('donut-root').innerHTML = renderRatioDonut({
    actionCount: stats.actionCount,
    releaseCount: stats.releaseCount,
  });

  const followUpsEl = document.getElementById('follow-ups-list');
  followUpsEl.innerHTML = stats.openFollowUps.length
    ? stats.openFollowUps.map((e) => `
        <div class="follow-up-item">
          <div>
            <strong>${escapeHtml(e.nextStep)}</strong>
            <small>${escapeHtml(e.whenWhere || '')}</small>
          </div>
          <button class="btn btn-primary btn-small" data-action="complete" data-id="${e.id}">Mark complete</button>
        </div>`).join('')
    : `<p class="empty-note">No open follow-ups. Nice and clear.</p>`;

  const evidenceEl = document.getElementById('evidence-list');
  evidenceEl.innerHTML = stats.completedEntries.length
    ? stats.completedEntries
        .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
        .map((e) => `
          <div class="evidence-item">
            <p class="evidence-action">${escapeHtml(e.chosenAction)}</p>
            <p class="evidence-outcome">${escapeHtml(e.outcome)}</p>
            <span class="evidence-confidence">Confidence ${e.confidenceBefore} → ${e.confidenceAfter}</span>
          </div>`).join('')
    : `<p class="empty-note">Completed actions will show up here as proof you followed through.</p>`;
}

document.getElementById('follow-ups-list').addEventListener('click', (e) => {
  const target = e.target.closest('[data-action="complete"]');
  if (target) openCompleteModal(target.dataset.id);
});

/* ---------------------------------------------------------------------- */
/* Init                                                                     */
/* ---------------------------------------------------------------------- */

initTabs();
renderWizard();
renderDashboard();
