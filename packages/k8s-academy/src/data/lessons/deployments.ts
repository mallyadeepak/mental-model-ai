import type { Lesson } from '../types';

export const deploymentsLesson: Lesson = {
  id: 'deployments',
  title: 'Deployments & ReplicaSets',
  icon: '🚀',
  tagline: 'Declare "I want 3 of these, forever" and let controllers do the rest.',
  category: 'Workloads',
  explanation: `
This is the layer almost everyone actually uses instead of bare Pods. A **Deployment** declares a Pod template and a desired replica count. It doesn't manage Pods directly — it manages a **ReplicaSet**, which is the thing that actually manages Pods.

Why two layers? Because a Deployment's real job is managing **change over time** — rolling out a new image version, pausing a rollout, rolling back a bad release. It does this by creating a *new* ReplicaSet for every distinct Pod template (tracked by a template hash) and shifting replica counts between the old and new ReplicaSet gradually. The ReplicaSet's job is much dumber and more mechanical: "make sure exactly N Pods matching this label selector exist, right now" — full stop, no history, no rollout logic.

This split is a really common Kubernetes pattern worth internalizing: a **higher-level controller that owns a lower-level controller**, each with one clear job. You'll see it again with CronJob → Job → Pod.

The self-healing property people love about Kubernetes comes entirely from the ReplicaSet's reconcile loop: it doesn't ask "did a Pod die, and why" — it just continuously asks "how many Pods matching my selector exist right now, and how many should there be?" and creates or deletes the difference. Delete a Pod by hand and a new one appears within seconds, not because Kubernetes "noticed a crash" but because the count went from 3 to 2 and the loop closes that gap every time it runs.

### Under the hood

Real Kubernetes runs this as two independent controllers inside \`kube-controller-manager\`, each watching different objects:
- The **Deployment controller** watches Deployments, computes a pod-template-hash from the template, and creates/scales ReplicaSets.
- The **ReplicaSet controller** watches ReplicaSets, and does simple set-arithmetic against live Pods: \`desired - current\`, create or delete that many.

Our simulator mirrors this exactly as two separate functions run every tick: \`reconcileDeployments()\` then \`reconcileReplicaSets()\` in \`src/engine/simulator.ts\` — open the Cluster panel and you'll see new ReplicaSets appear at 0 replicas, then ramp up, exactly like the real controllers do.
`,
  keyTerms: [
    { term: 'Deployment', definition: 'Declares a Pod template + replica count; owns ReplicaSets and drives rollouts/rollbacks.' },
    { term: 'ReplicaSet', definition: 'Ensures exactly N Pods matching a label selector exist. Dumb, mechanical, and owned by a Deployment.' },
    { term: 'pod-template-hash', definition: "A hash of the Pod template, used as a label to group Pods under the right ReplicaSet and detect template changes." },
    { term: 'Self-healing', definition: 'An emergent property of continuous reconciliation, not an explicit "if crashed, restart" rule.' },
    { term: 'Label selector', definition: 'How controllers and Services find "their" Pods — by matching labels, never by name.' },
  ],
  diagram: {
    nodes: [
      { id: 'dep', label: 'Deployment', sublabel: 'web, replicas: 3', depth: 0, kind: 'control' },
      { id: 'rs', label: 'ReplicaSet', sublabel: 'web-a1b2c3', depth: 1, kind: 'control' },
      { id: 'p1', label: 'Pod', depth: 2, kind: 'workload' },
      { id: 'p2', label: 'Pod', depth: 2, kind: 'workload' },
      { id: 'p3', label: 'Pod', depth: 2, kind: 'workload' },
    ],
    edges: [
      { from: 'dep', to: 'rs', label: 'owns' },
      { from: 'rs', to: 'p1', label: 'owns' },
      { from: 'rs', to: 'p2', label: 'owns' },
      { from: 'rs', to: 'p3', label: 'owns' },
    ],
  },
  yamlFilename: 'deployment.yaml',
  yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: default
  labels:
    app: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:1.25
          resources:
            requests:
              cpu: "150m"
              memory: "96Mi"
`,
  yamlNotes: [
    { match: 'replicas: 3', note: 'The desired count. The ReplicaSet controller\'s entire job is keeping the live Pod count equal to this.' },
    { match: 'selector.matchLabels', note: 'Must be a subset of the Pod template\'s labels — this is how the ReplicaSet knows which Pods are "its" Pods.' },
    { match: 'template', note: "The Pod spec that gets stamped out N times. Changing this triggers a whole new ReplicaSet, which you'll see in the Rolling Updates lesson." },
  ],
  challenge: {
    instructions:
      'Apply deployment.yaml. Watch the Cluster panel: a new ReplicaSet should appear and ramp up to 3 Pods, all eventually Ready. Then try deleting one Pod from the Terminal ("kubectl delete pod <name>") and watch it get replaced automatically.',
    hints: [
      'Apply from the Manifest tab first, then switch to the Cluster panel to watch the ReplicaSet ramp up.',
      'Use "kubectl get pods" in the Terminal to find an exact Pod name to delete.',
      'The challenge only checks that 3 Pods are Ready under the web Deployment — deleting one is for you to see self-healing, not required to pass.',
    ],
    check: (state) => {
      const dep = Object.values(state.deployments).find((d) => d.meta.namespace === 'default' && d.meta.name === 'web');
      if (!dep) return 'No Deployment named "web" found yet — apply the manifest first.';
      const pods = Object.values(state.pods).filter(
        (p) => p.meta.namespace === 'default' && p.meta.labels['app'] === 'web' && p.phase !== 'Terminating'
      );
      const ready = pods.filter((p) => p.ready).length;
      if (ready < dep.replicas) return `${ready}/${dep.replicas} replicas Ready so far — give the ReplicaSet a few more ticks.`;
      return null;
    },
    successMessage: 'All 3 replicas of the web Deployment are up and Ready, managed hands-off by its ReplicaSet.',
  },
  quiz: [
    {
      question: 'Why does a Deployment create a ReplicaSet instead of managing Pods directly?',
      options: [
        'Historical accident, no real reason',
        'To separate rollout/rollback history (Deployment) from the mechanical "keep N Pods alive" job (ReplicaSet)',
        'ReplicaSets are required by the Kubernetes API for security reasons',
        'Because Pods cannot be owned by a Deployment directly, only by a ReplicaSet, for networking reasons',
      ],
      correctIndex: 1,
      explanation: 'The layering lets the Deployment controller focus purely on managing multiple ReplicaSets over time (for rollouts), while the ReplicaSet controller does the simple, mechanical replica-count reconciliation.',
    },
    {
      question: 'You manually delete one Pod that belongs to a ReplicaSet with replicas: 3. What happens?',
      options: [
        'Nothing — Kubernetes waits for you to recreate it',
        'The Deployment is deleted entirely',
        'The ReplicaSet controller notices the live count (2) is below desired (3) and creates a replacement',
        'The remaining 2 Pods are also deleted to keep things consistent',
      ],
      correctIndex: 2,
      explanation: 'This is exactly the reconcile loop in action: desired (3) minus current (2) is a shortfall of 1, so a new Pod is created — no special-casing of "why" the Pod disappeared.',
    },
    {
      question: 'What does a Service or ReplicaSet use to find "its" Pods?',
      options: [
        'Pod names matching a prefix',
        'The order Pods were created in',
        'Label selectors matched against Pod labels',
        'The Node the Pod is running on',
      ],
      correctIndex: 2,
      explanation: 'Names are irrelevant to Kubernetes\' object model. Every relationship between a controller/Service and a Pod is a label selector match.',
    },
  ],
};
