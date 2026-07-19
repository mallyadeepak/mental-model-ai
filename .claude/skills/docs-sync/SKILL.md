---
name: docs-sync
description: Keep documentation in sync with code changes in this repo before committing. Use before every git commit that touches code, features, project structure, dependencies, or commands anywhere in this repo (mental-model-ai packages, vantage, or any future project added here) — checks whether the relevant README(s) and in-app docs still match what the code actually does, and updates them in the same commit.
---

# Docs Sync

This repo holds more than one project (`packages/*` for mental-model-ai,
`vantage/` for the worry/problem/gratitude app, and possibly more added
later). Each has its own README, and the root `README.md` should mention
every top-level project. Documentation drifts fast when features get added
without a matching doc update — this skill is the checklist that prevents
that.

Run this before finalizing any commit that changes code in this repo.

## What to check

1. **Diff first.** Run `git diff --staged` (or `git diff` if nothing is
   staged yet) to see exactly what changed.
2. **Identify the affected project(s)** from the changed paths:
   - `vantage/**` → `vantage/README.md`, and `vantage/index.html`'s About
     tab if the change affects what a feature does or how it's grounded.
   - `packages/**` or root config (`package.json`, `turbo.json`,
     `pnpm-workspace.yaml`) → root `README.md`.
   - A **new top-level project directory** → root `README.md` needs a
     section/link for it, the same way it already covers `packages/`.
3. **For each affected README, verify it still matches reality:**
   - Feature lists — did this change add, remove, or rename a feature?
   - "Project structure" file/directory trees — do they match what's
     actually on disk (`ls` the directory and compare)?
   - Setup/run commands — do they still work as written?
   - Any named concepts, flows, or terminology that changed (e.g. a
     rename) — grep the docs for the old name and update every hit.
4. **Code comments**: only touch them if the change made an existing
   comment wrong or misleading — don't add new comments proactively (see
   the general "no comments unless the why is non-obvious" rule).
5. **Fix what's stale in the same commit** as the code change — not a
   follow-up commit, not left for later. Documentation and the code it
   describes should never be split across commits.

## Quick staleness grep

After editing, sanity-check for leftover references to anything renamed or
removed in this change:

```bash
git grep -n "<old-name-or-term>" -- '*.md' '*.html'
```

## When it's fine to skip

- Pure formatting/lint fixes with no behavior change.
- Test-only changes that don't alter documented behavior.
- Internal refactors where the documented external behavior, structure,
  and commands are unaffected.

When in doubt, do a quick pass anyway — it's cheap, and a stale README is
easy to miss otherwise.
