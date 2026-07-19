# Vantage

A small, private web app for practicing three related skills: untangling
worry from problem-solving, working through problems directly, and
noticing what's already good. All three are ways of gaining a steadier,
more accurate view of your own situation — a better vantage point on it.

This is a standalone project living alongside `mental-model-ai` in this
repository. It doesn't share any code or dependencies with it — it's a
single static site (plain HTML/CSS/JS, no build step, no framework, no
server) that runs entirely in your browser.

## Why this exists

Anxious thought tends to blur the line between "something I need to act on"
and "a hypothetical spiral I can't do anything about" — everything ends up
feeling equally urgent and equally unsolvable. And the flip side gets
neglected too: what's already going well rarely gets noticed on purpose.
Vantage exists to force both distinctions, every time, until doing it
becomes a habit rather than an effort — a repeatable exercise, not a
one-time fix.

## The three practices

Starting a new entry means picking one of three flows:

### 🧭 Untangle a worry

1. **Name the thought.** Writing a worry down as a specific sentence already
   reduces its grip — vague dread is harder to sit with than a concrete
   claim you can look at.
2. **Check for thinking patterns.** Ten common cognitive distortions (Aaron
   Beck, David Burns) — catastrophizing, fortune-telling, mind reading,
   all-or-nothing thinking, and others — quietly inflate how bad or likely
   something seems. Naming the pattern makes it easier to question.
3. **Ask if it's actionable.** The core move, drawn from CBT-based worry
   management (Borkovec's worry-outcome research, Leahy's worry-decision
   work): is this a present or near-term problem you can influence, or a
   hypothetical / uncontrollable "what if"? The two need different
   responses, and treating one like the other is where most worry gets
   stuck.
4. **If actionable** — it drops into the same problem-solving flow as
   below. **If not** — see "set it down" below.

### 🧩 Work through a problem

When something is already known to be actionable — no worry framing
needed — this flow goes straight to a short version of Problem-Solving
Therapy (D'Zurilla & Nezu): define the problem precisely, generate options
without filtering, choose one, and commit to a specific next step with a
time and place attached (an "implementation intention" — shown in the
literature to meaningfully increase follow-through vs. a vague intention).

**Set it down.** For worries that aren't actionable: separating what's in
your control from what isn't, and deliberately postponing or releasing the
rest, is a practiced skill — related to worry-postponement technique and
the classic dichotomy of control — not the same thing as suppression or
avoidance.

### ☀️ Notice something good

A quick gratitude check-in and free journal. Gratitude journaling has a
real, replicated effect on wellbeing (Emmons & McCullough), and
elaborating on *why* something matters — rather than just listing it —
amplifies the benefit (Lyubomirsky's research on savoring), consistent
with the broaden-and-build theory of positive emotion (Fredrickson). An
optional free-write step exists for whatever else doesn't fit neatly into
either worry or gratitude.

### Bank the evidence

Self-confidence isn't built by reassurance — it's built from mastery
experiences: specific, retrievable memories of "I said I'd do something
hard, and I did it" (Albert Bandura's self-efficacy theory). The
dashboard's evidence bank collects completed plans from both the worry and
problem flows, and the streak/weekly view exists to reinforce showing up
and doing the exercise repeatedly.

## Running it

No install, no build, no dependencies.

```bash
cd vantage
python3 -m http.server 8080
# then open http://localhost:8080
```

Or open `index.html` directly in a browser. Or serve the folder with any
static file server you like (`npx serve`, VS Code's Live Server, etc.).

## Data & privacy

Everything you write is stored only in `localStorage`, in your browser, on
your device. There is no account, no backend, no network request, and no
analytics — nothing typed into this app is ever sent anywhere. Clearing
your browser's site data for this app will erase your history, so keep that
in mind if you want a long-term record.

If you have data from an earlier version of this project (Worry Compass),
it's picked up automatically the first time Vantage loads — no action
needed.

## Project structure

```
vantage/
├── index.html        # markup + all tab panels
├── styles.css         # theme (light/dark), layout, components
├── js/
│   ├── app.js          # UI logic: wizard flow, tabs, history, dashboard
│   ├── storage.js       # localStorage CRUD + stats/streak calculations
│   ├── distortions.js   # the 10 cognitive distortion definitions
│   └── charts.js        # small hand-rolled SVG charts (no chart library)
└── README.md
```

## Scope

This is a self-reflection and practice tool, not therapy, diagnosis, or
medical advice, and it is not a substitute for working with a qualified
therapist or psychiatrist — especially if worry is severe, persistent, or
affecting daily functioning. If you're in crisis or thinking about harming
yourself, please contact a mental health professional or a crisis line right
away — in the US, you can call or text **988** (Suicide & Crisis Lifeline).
