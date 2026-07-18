# Worry Compass

A small, private web app for practicing one specific skill: telling the
difference between a **worry** and a **problem**, then handling each one the
way that actually helps — solving what's solvable, and deliberately setting
down what isn't.

This is a standalone project living alongside `mental-model-ai` in this
repository. It doesn't share any code or dependencies with it — it's a
single static site (plain HTML/CSS/JS, no build step, no framework, no
server) that runs entirely in your browser.

## Why this exists

Anxious thought tends to blur the line between "something I need to act on"
and "a hypothetical spiral I can't do anything about" — everything ends up
feeling equally urgent and equally unsolvable. This tool exists to force
that distinction, every time, until doing it becomes a habit rather than an
effort. That's the "muscle" in the tagline: it's a repeatable exercise, not
a one-time fix.

## The method

Each entry walks through the same six moves:

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
4. **If actionable — solve it.** A short version of Problem-Solving Therapy
   (D'Zurilla & Nezu): define the problem precisely, generate options
   without filtering, choose one, and commit to a specific next step with a
   time and place attached (an "implementation intention" — shown in the
   literature to meaningfully increase follow-through vs. a vague
   intention).
5. **If not actionable — set it down.** Separating what's in your control
   from what isn't, and deliberately postponing or releasing the rest, is a
   practiced skill — related to worry-postponement technique and the
   classic dichotomy of control — not the same thing as suppression or
   avoidance.
6. **Bank the evidence.** Self-confidence isn't built by reassurance — it's
   built from mastery experiences: specific, retrievable memories of "I said
   I'd do something hard, and I did it" (Albert Bandura's self-efficacy
   theory). The dashboard's evidence bank exists to make those memories easy
   to find again, and the streak/weekly view exists to reinforce showing up
   and doing the exercise repeatedly.

## Running it

No install, no build, no dependencies.

```bash
cd worry-compass
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

## Project structure

```
worry-compass/
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
