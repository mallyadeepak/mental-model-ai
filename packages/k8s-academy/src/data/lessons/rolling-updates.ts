import type { Lesson } from '../types';

export const rollingUpdatesLesson: Lesson = {
  id: 'rolling-updates',
  title: 'Rolling Updates & Rollbacks',
  icon: '🔄',
  tagline: 'Ship a new version with zero downtime — and undo it in seconds if it\'s bad.',
  category: 'Workloads',
  explanation: `
Change the Pod template of a Deployment — a new image tag, most commonly — and Kubernetes doesn't touch existing Pods in place. Instead it creates a **new ReplicaSet** for the new template and gradually shifts replica counts: the new ReplicaSet scales up while the old one scales down, one or a few Pods at a time, until the new one fully replaces the old one. This is the **RollingUpdate** strategy, and it's the default for a reason: at every point in the transition, some number of Pods from *each* version are Ready and serving traffic, so there's no window where capacity drops to zero.

Two settings (defaults shown) control the shape of that transition: \`maxUnavailable\` (how many Pods below desired count you'll tolerate mid-rollout) and \`maxSurge\` (how many *extra* Pods above desired count you'll allow while ramping up the new version). Tighter values are safer but slower; looser values are faster but risk brief capacity dips.

Because the old ReplicaSet isn't deleted — just scaled to 0 — Kubernetes keeps a **rollout history**. \`kubectl rollout undo\` doesn't recreate anything from scratch; it just points the Deployment's template back at a previous revision and lets the same rolling-update machinery run in reverse: the "old" (target) ReplicaSet ramps back up, the "new" (bad) one ramps down. This is why rollbacks are typically just as safe and gradual as forward rollouts — it's the identical mechanism, run backwards.

\`kubectl rollout status\` is your way to watch this converge without staring at a Pod list: it blocks and reports progress until the number of Ready, updated replicas matches the desired count.

### Under the hood

The core algorithm each tick of a rolling update: if the new ReplicaSet has fewer Pods than desired, add one; if any old ReplicaSet still has Pods, remove one. Repeat. This app's \`reconcileDeployments()\` does exactly this, one step per tick — watch the two colored bars in the Deployments section of the Cluster panel move in opposite directions during your rollout below.
`,
  keyTerms: [
    { term: 'RollingUpdate strategy', definition: 'Default Deployment strategy: gradually shift replicas from the old ReplicaSet to the new one with no downtime.' },
    { term: 'maxUnavailable', definition: 'How far below the desired replica count the rollout is allowed to dip at any moment.' },
    { term: 'maxSurge', definition: 'How many extra Pods above desired count are allowed while the new version ramps up.' },
    { term: 'Revision history', definition: "Old ReplicaSets are kept (scaled to 0) so a Deployment can roll back to a prior template." },
    { term: 'kubectl rollout undo', definition: 'Points the Deployment back at a previous template revision, triggering a reverse rolling update.' },
  ],
  diagram: {
    nodes: [
      { id: 'oldrs', label: 'Old ReplicaSet', sublabel: 'v1, scaling down', depth: 0, kind: 'control' },
      { id: 'dep', label: 'Deployment', sublabel: 'template changed', depth: 1, kind: 'control' },
      { id: 'newrs', label: 'New ReplicaSet', sublabel: 'v2, scaling up', depth: 0, kind: 'control' },
      { id: 'oldpods', label: 'v1 Pods', sublabel: 'count ↓', depth: -1, kind: 'workload' },
      { id: 'newpods', label: 'v2 Pods', sublabel: 'count ↑', depth: -1, kind: 'workload' },
    ],
    edges: [
      { from: 'dep', to: 'oldrs', label: 'ramps down' },
      { from: 'dep', to: 'newrs', label: 'ramps up' },
      { from: 'oldrs', to: 'oldpods' },
      { from: 'newrs', to: 'newpods' },
    ],
  },
  yamlFilename: 'frontend-deployment.yaml',
  yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: default
  labels:
    app: frontend
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: nginx:1.24
          resources:
            requests:
              cpu: "100m"
              memory: "64Mi"
`,
  yamlNotes: [
    { match: 'image: nginx:1.24', note: 'Step 2: change this to nginx:1.25 and re-apply to trigger a rolling update.' },
    { match: 'strategy.type', note: 'RollingUpdate (default) overlaps old and new Pods. Recreate instead kills all old Pods before starting new ones — simpler, but with downtime.' },
  ],
  challenge: {
    instructions:
      'Step 1: Apply frontend-deployment.yaml as-is and let all 4 replicas reach Ready (v1.24). Step 2: change the image to nginx:1.25 and re-apply — watch the rollout in the Cluster panel. Step 3: in the Terminal, run "kubectl rollout undo deployment/frontend" to revert back to v1.24, and let it stabilize.',
    hints: [
      'Wait for the baseline v1.24 rollout to fully finish (4/4 ready) before changing anything — it\'s easier to see the transition that way.',
      'Edit image: nginx:1.24 to image: nginx:1.25 in the Manifest tab, then click apply again.',
      'Once the v1.25 rollout looks complete, go to the Terminal and run: kubectl rollout undo deployment/frontend',
      'You can also check progress anytime with: kubectl rollout status deployment/frontend',
    ],
    check: (state) => {
      const dep = Object.values(state.deployments).find((d) => d.meta.namespace === 'default' && d.meta.name === 'frontend');
      if (!dep) return 'No Deployment named "frontend" found yet — apply the manifest first.';
      if (dep.history.length < 2) return 'No rollout detected yet — change the image tag to nginx:1.25 and re-apply to trigger one.';
      const image = dep.template.containers[0]?.image;
      if (image !== 'nginx:1.24') return 'Deployment is not back on nginx:1.24 yet — run "kubectl rollout undo deployment/frontend" in the Terminal.';
      const pods = Object.values(state.pods).filter((p) => p.meta.namespace === 'default' && p.meta.labels['app'] === 'frontend' && p.phase !== 'Terminating');
      const ready = pods.filter((p) => p.ready).length;
      if (ready < dep.replicas) return `Rolling back — ${ready}/${dep.replicas} replicas Ready so far.`;
      return null;
    },
    successMessage: 'You rolled frontend forward to nginx:1.25 and back to nginx:1.24, watching the exact same rolling-update machinery run in both directions.',
  },
  quiz: [
    {
      question: 'During a RollingUpdate, what happens to Pods running the old version?',
      options: [
        'They are all deleted instantly the moment you apply the change',
        'They keep serving traffic and are gradually terminated as new-version Pods become Ready',
        'They are paused, not terminated, until the rollout finishes',
        'They are converted in place to the new version',
      ],
      correctIndex: 1,
      explanation: 'RollingUpdate overlaps old and new Pods on purpose — old Pods keep serving until enough new ones are Ready to take over, which is what avoids a capacity drop to zero.',
    },
    {
      question: 'How does "kubectl rollout undo" actually roll back a Deployment?',
      options: [
        'It restores a full snapshot of the cluster from before the change',
        'It points the Deployment\'s template back at a previous revision, triggering a rolling update in reverse',
        'It deletes the Deployment and recreates it from a backup file',
        'It pauses the cluster and asks an administrator to manually intervene',
      ],
      correctIndex: 1,
      explanation: 'There is no separate rollback mechanism — undo just changes the desired template back to a prior one, and the same reconcile loop that drives forward rollouts drives the rollback.',
    },
    {
      question: 'What does maxUnavailable control?',
      options: [
        'The maximum number of Nodes that can be down at once',
        'How many Pods below the desired replica count a rollout is allowed to run with at any moment',
        'The number of container restarts allowed before CrashLoopBackOff',
        'How many old ReplicaSets are kept in history',
      ],
      correctIndex: 1,
      explanation: 'maxUnavailable caps how much capacity can dip during the rollout; maxSurge (its counterpart) caps how far above desired count the rollout can temporarily go.',
    },
  ],
};
