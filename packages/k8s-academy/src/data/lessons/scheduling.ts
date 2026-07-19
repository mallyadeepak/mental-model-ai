import type { Lesson } from '../types';

export const schedulingLesson: Lesson = {
  id: 'scheduling',
  title: 'Nodes & the Scheduler',
  icon: '🗺️',
  tagline: 'How Kubernetes decides *where* a Pod runs — and why "not enough room" is a real failure mode.',
  category: 'Foundations',
  explanation: `
A **Node** is a worker machine — VM or bare metal — with a fixed amount of CPU and memory it can hand out, called its **allocatable capacity**. A cluster is just a pool of Nodes.

Every container in a Pod can declare **resource requests**: the CPU and memory it needs reserved. \`kube-scheduler\`'s job is simple to state and subtle to implement: for every Pod without a Node assignment yet, find a Node whose *remaining* allocatable capacity (allocatable minus what's already promised to other Pods on it) is enough to cover that Pod's requests, then bind the Pod to it.

If **no** Node has room, the Pod doesn't fail — it just sits in \`Pending\` forever, with an event like \`FailedScheduling: 0/3 nodes available: insufficient cpu\`. This is one of the most common real-world "why is my Pod not starting" bugs, and it's almost always one of:
- The Pod's requests are simply too large for any Node in the cluster.
- The cluster is genuinely full and needs more Nodes (cluster autoscaler territory).
- A scheduling constraint (node affinity, taints/tolerations — not modeled in this simulator) is ruling every Node out.

Requests aren't a hard ceiling on usage — that's what **limits** are for (a separate, optional field). Requests are purely what the scheduler reserves up front, which is why setting them accurately matters: request too little and you can pack a Node into resource starvation at runtime; request too much and you waste capacity the scheduler thinks is spoken for.

### Under the hood

Real \`kube-scheduler\` runs a two-phase pipeline per Pod: **filtering** (which Nodes are even legal — capacity, taints, affinity) and **scoring** (which of the legal Nodes is *best* — spreading load, bin-packing, etc.), then picks the top-scoring Node and writes a binding. Our simulator's \`scheduleNode()\` in \`src/engine/simulator.ts\` does a simplified version of just the filtering step: first Node in the list with enough free CPU and memory wins. No scoring, no affinity — but the core "does it fit?" question is exactly the same one the real scheduler answers thousands of times a second in a big cluster.
`,
  keyTerms: [
    { term: 'Allocatable capacity', definition: "A Node's usable CPU/memory after reserving some for the OS and kubelet itself." },
    { term: 'Resource requests', definition: 'What a container declares it needs reserved — this is what the scheduler bin-packs against.' },
    { term: 'Resource limits', definition: 'An optional hard ceiling on usage; exceeding a memory limit gets a container killed (OOMKilled).' },
    { term: 'FailedScheduling', definition: 'The event emitted when no Node currently has enough free capacity for a Pod.' },
    { term: 'Binding', definition: "The act of the scheduler writing a Pod's nodeName, committing it to that Node." },
  ],
  diagram: {
    nodes: [
      { id: 'pod', label: 'Pending Pod', sublabel: 'no nodeName yet', depth: 0, kind: 'workload' },
      { id: 'sched', label: 'kube-scheduler', depth: 1, kind: 'control' },
      { id: 'n1', label: 'Node 1', sublabel: 'full', depth: 2, kind: 'external' },
      { id: 'n2', label: 'Node 2', sublabel: 'room to fit', depth: 2, kind: 'external' },
      { id: 'n3', label: 'Node 3', sublabel: 'full', depth: 2, kind: 'external' },
      { id: 'bound', label: 'Bound Pod', sublabel: 'nodeName: node-2', depth: 3, kind: 'workload' },
    ],
    edges: [
      { from: 'pod', to: 'sched', label: 'watched' },
      { from: 'sched', to: 'n1', label: 'filter: no room' },
      { from: 'sched', to: 'n2', label: 'filter: fits' },
      { from: 'sched', to: 'n3', label: 'filter: no room' },
      { from: 'n2', to: 'bound', label: 'bind' },
    ],
  },
  yamlFilename: 'big-pod.yaml',
  yaml: `apiVersion: v1
kind: Pod
metadata:
  name: big-pod
  namespace: default
spec:
  containers:
    - name: number-cruncher
      image: nginx:1.25
      resources:
        requests:
          cpu: "3000m"
          memory: "512Mi"
`,
  yamlNotes: [
    { match: 'cpu: "3000m"', note: 'Each simulated Node only has 2000m (2 vCPU) allocatable — this alone is too big to ever fit on one Node.' },
    { match: 'requests', note: 'This is the number the scheduler checks. Try shrinking it and re-applying to watch the Pod go from stuck to scheduled.' },
  ],
  challenge: {
    instructions:
      'Apply big-pod.yaml as-is and confirm in the Cluster panel that it sits in the "Scheduler queue" with nowhere to fit. Then edit the YAML to lower cpu to something like "500m", re-apply, and watch it get scheduled and become Ready.',
    hints: [
      'Every simulated Node has 2000m CPU allocatable — a 3000m request can never fit on any single Node.',
      'The Manifest tab lets you edit and re-apply the same file — apply is create-or-update, just like the real kubectl.',
      'After lowering the request, re-click "kubectl apply -f big-pod.yaml" to push the change.',
    ],
    check: (state) => {
      const pod = Object.values(state.pods).find((p) => p.meta.namespace === 'default' && p.meta.name === 'big-pod');
      if (!pod) return 'No Pod named "big-pod" found yet — apply the manifest first (even with the oversized request, to see it get stuck).';
      if (!pod.nodeName) return 'big-pod is still Pending — its resource request is too large for any Node. Lower it and re-apply.';
      if (!pod.ready) return 'big-pod was scheduled — give it another tick or two to become Ready.';
      return null;
    },
    successMessage: 'big-pod is scheduled and Ready — lowering the resource request gave the scheduler a Node it could actually fit the Pod onto.',
  },
  quiz: [
    {
      question: 'A Pod stuck in Pending with event "FailedScheduling: insufficient cpu" most likely means:',
      options: [
        'The container image failed to download',
        'No Node currently has enough free capacity to satisfy the Pod\'s resource requests',
        'The Pod has a syntax error in its YAML',
        'The Service selector does not match any Pods',
      ],
      correctIndex: 1,
      explanation: 'FailedScheduling specifically means the scheduler could not find a Node with enough allocatable capacity left — either the cluster needs more Nodes or the request is oversized.',
    },
    {
      question: 'What is the difference between a resource "request" and a "limit"?',
      options: [
        'They are the same field with two names',
        'A request is what the scheduler reserves up front; a limit is a hard ceiling enforced at runtime',
        'A limit is used for scheduling; a request is enforced at runtime',
        'Requests only apply to memory, limits only apply to CPU',
      ],
      correctIndex: 1,
      explanation: 'Requests drive scheduling decisions (bin-packing). Limits are optional runtime ceilings — exceed a memory limit and the container gets OOMKilled, independent of what was requested.',
    },
  ],
};
