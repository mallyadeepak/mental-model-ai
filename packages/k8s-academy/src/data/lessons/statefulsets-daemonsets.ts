import type { Lesson } from '../types';

export const statefulDaemonLesson: Lesson = {
  id: 'statefulsets-daemonsets',
  title: 'StatefulSets & DaemonSets',
  icon: '🧱',
  tagline: 'Two more Pod controllers, for the two things a Deployment refuses to guarantee: identity and node coverage.',
  category: 'Advanced patterns',
  explanation: `
A Deployment's ReplicaSet is deliberately careless about *which* Pod is which — it treats all replicas as interchangeable, creates them in any order, in parallel, with random name suffixes, and spreads them wherever the scheduler finds room. That's exactly right for stateless web servers. It's exactly wrong for two other common cases.

**StatefulSet** exists for workloads that need a **stable, predictable identity** — think a database cluster where node 0 is the primary and nodes 1-2 are replicas that need to know, by name, who to sync from. A StatefulSet's Pods get:
- **Stable, ordinal names**: \`db-0\`, \`db-1\`, \`db-2\` — not random suffixes — so the same logical replica keeps the same name across restarts.
- **Ordered, sequential startup**: \`db-1\` isn't created until \`db-0\` is Ready. This matters when replica \`N\` needs to find and sync from replica \`N-1\` at startup.
- **Ordered, reverse-sequential shutdown**: scaling down removes the *highest*-numbered Pod first, not an arbitrary one — you shrink from the edges in, not from the middle out.
- **Stable per-Pod storage** in real Kubernetes (via \`volumeClaimTemplates\`, one PersistentVolumeClaim per ordinal that follows that specific Pod across rescheduling) — not modeled in this simplified sandbox, but worth knowing: it's the other half of "stable identity," alongside the name.

**DaemonSet** exists for the opposite kind of requirement: not "one specific Pod with an identity" but "**exactly one Pod on every Node**, automatically, including Nodes added later." This is the pattern for node-level infrastructure that has to run everywhere: a log-shipping agent, a monitoring exporter, a network plugin. No replica count to configure — the Node count *is* the replica count, because coverage is the entire point.

The mental shortcut worth keeping: **ReplicaSet asks "how many," StatefulSet asks "which one, in what order," DaemonSet asks "on every Node."** Same underlying idea — a controller reconciling a desired set of Pods against reality — with a different shape of "desired" for each.

### Under the hood

This simulator implements both with real (if simplified) semantics, not just cosmetics: \`reconcileStatefulSets()\` in \`src/engine/simulator.ts\` only creates ordinal \`N\` once ordinal \`N-1\` is Ready, and removes the highest ordinal first on scale-down. \`reconcileDaemonSets()\` loops every Node and ensures exactly one Pod is bound there, bypassing the normal scheduler's bin-packing entirely — a DaemonSet Pod's placement isn't a *choice*, it's a *given*. Try the challenge below and watch the StatefulSet Pods light up strictly left-to-right in the Cluster panel, one at a time — a Deployment's ReplicaSet would light all of them up together.
`,
  keyTerms: [
    { term: 'StatefulSet', definition: 'Manages Pods with stable ordinal names and strictly ordered, one-at-a-time startup/shutdown.' },
    { term: 'Ordinal index', definition: 'The stable 0, 1, 2... suffix a StatefulSet gives its Pods, e.g. db-0, db-1.' },
    { term: 'volumeClaimTemplates', definition: "How a real StatefulSet gives each ordinal its own persistent storage that follows it across reschedules (not simulated here)." },
    { term: 'DaemonSet', definition: 'Ensures exactly one Pod runs on every (matching) Node, automatically covering Nodes added later.' },
    { term: 'Node-level agent', definition: 'The typical DaemonSet workload: log shippers, monitoring exporters, network/storage plugins.' },
  ],
  diagram: {
    nodes: [
      { id: 'sts', label: 'StatefulSet', sublabel: 'ordered identity', depth: 0, kind: 'control' },
      { id: 's0', label: 'db-0', sublabel: 'created first', depth: 1, kind: 'workload' },
      { id: 's1', label: 'db-1', sublabel: 'waits for db-0 Ready', depth: 1, kind: 'workload' },
      { id: 'ds', label: 'DaemonSet', sublabel: 'one per Node', depth: 0, kind: 'control' },
      { id: 'n1', label: 'Node 1 → Pod', depth: 1, kind: 'external' },
      { id: 'n2', label: 'Node 2 → Pod', depth: 1, kind: 'external' },
    ],
    edges: [
      { from: 'sts', to: 's0', label: '1st' },
      { from: 's0', to: 's1', label: 'must be Ready first' },
      { from: 'ds', to: 'n1' },
      { from: 'ds', to: 'n2' },
    ],
  },
  yamlFilename: 'stateful-and-daemon.yaml',
  yaml: `apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: db
  namespace: default
spec:
  replicas: 3
  serviceName: db
  template:
    metadata:
      labels:
        app: db
    spec:
      containers:
        - name: db
          image: myorg/postgres:1.0
          resources:
            requests:
              cpu: "150m"
              memory: "128Mi"
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: log-agent
  namespace: default
spec:
  template:
    metadata:
      labels:
        app: log-agent
    spec:
      containers:
        - name: log-agent
          image: myorg/log-shipper:1.0
          resources:
            requests:
              cpu: "50m"
              memory: "32Mi"
`,
  yamlNotes: [
    { match: 'kind: StatefulSet', note: 'Watch the Cluster panel: db-0 appears, then only once it is Ready does db-1 get created — never all three at once like a Deployment.' },
    { match: 'kind: DaemonSet', note: 'No replicas field at all — one Pod per Node is implied, so log-agent should land on all 3 simulated Nodes.' },
  ],
  challenge: {
    instructions:
      'Apply stateful-and-daemon.yaml. In the Cluster panel, confirm db-0, db-1, db-2 come up strictly one at a time (not together), and that log-agent ends up with one Pod on every Node.',
    hints: [
      'Give it time — StatefulSet ordinals are deliberately sequential, so this will visibly take longer than a Deployment reaching the same replica count.',
      'kubectl get statefulsets and kubectl get daemonsets both report READY counts from the Terminal.',
      'Check the Nodes section of the Cluster panel — each of the 3 Nodes should have exactly one log-agent Pod chip.',
    ],
    check: (state) => {
      const sts = Object.values(state.statefulSets).find((s) => s.meta.namespace === 'default' && s.meta.name === 'db');
      const ds = Object.values(state.daemonSets).find((d) => d.meta.namespace === 'default' && d.meta.name === 'log-agent');
      if (!sts || !ds) return 'Apply stateful-and-daemon.yaml first — it should create both the "db" StatefulSet and the "log-agent" DaemonSet.';
      const stsPods = Object.values(state.pods).filter((p) => p.meta.namespace === 'default' && p.meta.ownerRef?.kind === 'StatefulSet' && p.meta.ownerRef.name === 'db');
      const stsReady = stsPods.filter((p) => p.ready).length;
      if (stsReady < sts.replicas) return `db StatefulSet: ${stsReady}/${sts.replicas} Ready — ordinals come up one at a time, so this takes a little longer than usual.`;
      const dsPods = Object.values(state.pods).filter((p) => p.meta.namespace === 'default' && p.meta.ownerRef?.kind === 'DaemonSet' && p.meta.ownerRef.name === 'log-agent');
      const dsReady = dsPods.filter((p) => p.ready).length;
      if (dsReady < state.nodes.length) return `log-agent DaemonSet: ${dsReady}/${state.nodes.length} Nodes covered so far.`;
      return null;
    },
    successMessage: 'db-0, db-1, and db-2 came up in strict order, and log-agent is running on every single Node — two genuinely different guarantees from two different controllers.',
  },
  quiz: [
    {
      question: 'Why would a database cluster typically use a StatefulSet instead of a Deployment?',
      options: [
        'StatefulSets are faster to schedule',
        'It needs each replica to have a stable, predictable name/identity and to start up in a guaranteed order, which a Deployment\'s ReplicaSet does not provide',
        'Deployments cannot run containers that use persistent storage at all',
        'There is no real difference; it is a naming convention only',
      ],
      correctIndex: 1,
      explanation: 'A ReplicaSet treats replicas as interchangeable and creates them in parallel with random names — the opposite of what a primary/replica database topology needs.',
    },
    {
      question: 'What decides how many Pods a DaemonSet creates?',
      options: [
        'A replicas field you configure, just like a Deployment',
        'The number of Nodes in the cluster — one Pod per (matching) Node, automatically, with no count to set',
        'It always creates exactly 3 Pods',
        'The number of Services pointing at it',
      ],
      correctIndex: 1,
      explanation: 'DaemonSets have no replicas field because the desired count isn\'t a number you pick — it\'s "however many Nodes qualify," which grows or shrinks automatically as Nodes join or leave.',
    },
    {
      question: 'When a StatefulSet scales down from 3 replicas to 2, which Pod is removed?',
      options: [
        'A random one',
        'Whichever Pod has been running the shortest time',
        'The highest-ordinal Pod (db-2) — removal happens in strict reverse order',
        'All Pods are recreated fresh',
      ],
      correctIndex: 2,
      explanation: 'Scale-down mirrors scale-up: strictly ordered, just in reverse — shrinking from the highest ordinal inward, never from the middle of the set.',
    },
  ],
};
