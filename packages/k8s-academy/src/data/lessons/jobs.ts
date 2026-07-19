import type { Lesson } from '../types';

export const jobsLesson: Lesson = {
  id: 'jobs',
  title: 'Jobs & CronJobs',
  icon: '🧮',
  tagline: 'Not everything should run forever. Some things just need to run once — or on a schedule — and finish.',
  category: 'Automation',
  explanation: `
Everything you've built so far — Deployments, ReplicaSets — is designed around Pods that should run **forever**, restarted the instant they stop. That's the wrong model for batch work: a database migration, a nightly report, a one-off data backfill. Those should run **to completion** and then stop, successfully, without anything trying to restart them afterward.

A **Job** is that controller. Instead of "keep N Pods running always," its reconcile question is "has this Pod (or these Pods) finished successfully yet?" It creates Pods, watches them run to completion, and tracks a completion count against \`spec.completions\`. If a Job's Pod fails, the Job controller retries by creating a new Pod — but once enough Pods have succeeded, it stops entirely and leaves the Job marked \`Complete\`. No infinite restart loop, because "success" is a real terminal state for a Job, unlike for a Deployment.

Two fields shape how a Job runs its work:
- \`completions\` — how many successful Pod completions the Job needs total.
- \`parallelism\` — how many Pods can run at once while working toward that total.

A **CronJob** adds a time dimension on top: it creates a new Job on a repeating schedule (standard cron syntax, e.g. \`0 2 * * *\` for "2am daily"), the same way a Deployment creates ReplicaSets. This is another instance of the layered-controller pattern from earlier — CronJob owns Jobs, Jobs own Pods — each layer adding exactly one new concern (a schedule) on top of the layer below.

A common trap worth naming: **cron schedules use the cluster's clock and don't account for how long the previous run took.** If your nightly job usually takes 10 minutes but occasionally runs long, back-to-back scheduled runs can overlap unless you've set \`concurrencyPolicy: Forbid\` (skip a run if the previous one is still going) or \`Replace\` (kill the old one and start fresh).

### Under the hood

Our simulator collapses real cron syntax into "every N ticks" for legibility (see \`parseCronJob\` in \`src/engine/parse.ts\`) — a real CronJob controller instead computes the next scheduled time from the actual cron expression. The completion mechanics are faithful, though: \`reconcileJobs()\` in \`src/engine/simulator.ts\` creates Pods up to \`parallelism\`, and a Job-owned Pod transitions straight from Running to Completed after a fixed simulated duration rather than going through readiness at all — completion, not availability, is the thing being tracked.
`,
  keyTerms: [
    { term: 'Job', definition: 'Runs Pods to completion (not forever) and tracks successful completions against a target.' },
    { term: 'completions', definition: 'How many successful Pod completions a Job needs before it is marked Complete.' },
    { term: 'parallelism', definition: 'How many Pods a Job runs concurrently while working toward its completions target.' },
    { term: 'CronJob', definition: 'Creates a new Job on a repeating schedule — the same layered-controller pattern as Deployment → ReplicaSet.' },
    { term: 'concurrencyPolicy', definition: 'Controls whether overlapping scheduled runs are allowed, forbidden, or replace each other.' },
  ],
  diagram: {
    nodes: [
      { id: 'cron', label: 'CronJob', sublabel: 'on a schedule', depth: 0, kind: 'control' },
      { id: 'job1', label: 'Job (run #1)', depth: 1, kind: 'control' },
      { id: 'job2', label: 'Job (run #2)', depth: 1, kind: 'control' },
      { id: 'p1', label: 'Pod → Completed', depth: 2, kind: 'workload' },
      { id: 'p2', label: 'Pod → Completed', depth: 2, kind: 'workload' },
    ],
    edges: [
      { from: 'cron', to: 'job1', label: 'creates' },
      { from: 'cron', to: 'job2', label: 'creates' },
      { from: 'job1', to: 'p1', label: 'owns' },
      { from: 'job2', to: 'p2', label: 'owns' },
    ],
  },
  yamlFilename: 'batch.yaml',
  yaml: `apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate
  namespace: default
spec:
  completions: 1
  parallelism: 1
  template:
    metadata:
      labels:
        app: db-migrate
    spec:
      containers:
        - name: migrate
          image: myorg/migrator:1.0
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: nightly-report
  namespace: default
spec:
  schedule: "*/6 * * * *"
  jobTemplate:
    spec:
      template:
        metadata:
          labels:
            app: nightly-report
        spec:
          containers:
            - name: report
              image: myorg/reporter:1.0
`,
  yamlNotes: [
    { match: 'kind: Job', note: 'A one-shot run — completions: 1 means it needs exactly one Pod to finish successfully.' },
    { match: 'schedule: "*/6', note: 'This sandbox simplifies real cron syntax to "every N ticks" — here, a new Job every 6 ticks.' },
    { match: 'jobTemplate', note: "A CronJob's spec is a template for the Jobs it will create — that's the same nested-template pattern a Deployment uses for Pods." },
  ],
  challenge: {
    instructions:
      'Apply batch.yaml. Watch "kubectl get jobs" until db-migrate shows 1/1 completions. Then let a few ticks pass and check "kubectl get cronjobs" — nightly-report should show at least 1 run.',
    hints: [
      'db-migrate\'s Pod runs for a few ticks and then transitions straight to Completed — no readiness involved for Job pods.',
      'CronJobs need real simulated time to pass before their first scheduled run fires — leave the simulator running (unpaused) for a bit.',
      'kubectl get jobs and kubectl get cronjobs both work from the Terminal.',
    ],
    check: (state) => {
      const job = Object.values(state.jobs).find((j) => j.meta.namespace === 'default' && j.meta.name === 'db-migrate');
      if (!job) return 'No Job named "db-migrate" found yet — apply batch.yaml first.';
      if (job.succeeded < job.completions) return `db-migrate has ${job.succeeded}/${job.completions} completions so far — give it a few more ticks.`;
      const cron = Object.values(state.cronJobs).find((c) => c.meta.namespace === 'default' && c.meta.name === 'nightly-report');
      if (!cron) return 'db-migrate completed, but nightly-report CronJob is missing — re-apply the full manifest.';
      if (cron.runCount < 1) return 'nightly-report exists but has not fired yet — leave the simulator running a bit longer.';
      return null;
    },
    successMessage: 'db-migrate ran to completion and nightly-report has fired at least once on its schedule — batch work handled without anything trying to keep it "running forever."',
  },
  quiz: [
    {
      question: 'Why is a Deployment the wrong tool for a one-off database migration script?',
      options: [
        'Deployments cannot run containers with a database client',
        "A Deployment's reconcile loop treats a stopped Pod as a shortfall to fix — it would keep restarting the migration forever instead of recognizing it finished successfully",
        'Deployments do not support environment variables',
        'There is no real difference; either works fine',
      ],
      correctIndex: 1,
      explanation: 'A Job specifically models "success" as a terminal state. A Deployment/ReplicaSet has no such concept — it just keeps trying to reach the desired replica count, restarting completed Pods indefinitely.',
    },
    {
      question: 'What is the relationship between a CronJob and the Jobs it creates?',
      options: [
        'A CronJob directly manages Pods with no Job layer involved',
        'A CronJob creates a new Job on each scheduled trigger — the same layered pattern as Deployment → ReplicaSet',
        'CronJobs and Jobs are unrelated object types',
        'A single Job is reused and reset for every scheduled run',
      ],
      correctIndex: 1,
      explanation: 'Each scheduled trigger produces a brand-new Job object (which then creates its own Pods) — CronJob adds exactly one new concern, scheduling, on top of the Job/Pod layers below it.',
    },
  ],
};
