import type { Lesson } from '../types';

export const podsLesson: Lesson = {
  id: 'pods',
  title: 'Pods',
  icon: '📦',
  tagline: 'The smallest thing Kubernetes deploys — and almost never the thing you create directly.',
  category: 'Foundations',
  explanation: `
A **Pod** is the atomic unit of deployment in Kubernetes. Not a container — a Pod. That distinction trips up almost everyone coming from Docker.

A Pod is a thin wrapper around one or more containers that are guaranteed to:
- Land on the **same Node** together, always.
- Share the same **network namespace** — one IP address for the whole Pod, so containers inside it talk to each other over \`localhost\`.
- Optionally share **storage volumes** mounted into more than one container.

Why bundle containers at all? Because some things genuinely need to be *co-located and co-scheduled*. The classic example is a "sidecar": your app container plus a small helper container (a log shipper, a proxy like Envoy, a config-reloader) that has to live and die with it. Kubernetes doesn't try to schedule them independently and hope they land together — it guarantees it by making them one Pod.

Pods are also **disposable**. You almost never want to keep a specific Pod alive forever — if a Node dies, that Pod is gone for good, not rescheduled elsewhere by anything watching the Pod itself. That's the single biggest reason you rarely create bare Pods in production: nothing is watching to replace it. That job belongs to a *controller* — a ReplicaSet, a Deployment, a Job — which is the next lesson.

### Under the hood

When you \`kubectl apply\` a Pod, three separate control loops cooperate, running independently and reconciling toward the object's desired state:

1. **kube-apiserver** validates and persists the Pod object to etcd with \`status.phase = Pending\` and no \`nodeName\`.
2. **kube-scheduler** watches for Pods with no \`nodeName\`, scores every Node against the Pod's resource \`requests\` (and affinity/taint rules you haven't met yet), and writes a \`nodeName\` binding onto the Pod — this is called *binding*.
3. **kubelet** on that Node watches for Pods bound to it, pulls the container images, starts the containers, and reports status back (\`ContainerCreating\` → \`Running\`), including running any configured probes.

This app's simulator runs the same three phases every "tick" (see \`reconcileDeployments\` → \`reconcileReplicaSets\` → \`tickPods\` in \`src/engine/simulator.ts\`) so you can watch scheduling and startup happen step by step instead of in the blink of an eye a real cluster gives you.
`,
  keyTerms: [
    { term: 'Pod', definition: 'One or more containers that share network + storage and are always scheduled together.' },
    { term: 'kubelet', definition: 'The agent on every Node that actually starts containers and reports Pod status back to the API server.' },
    { term: 'kube-scheduler', definition: 'Watches for unscheduled Pods and assigns each one to a Node with enough free capacity.' },
    { term: 'Pod phase', definition: 'Pending → ContainerCreating → Running (→ Succeeded/Failed). A coarse lifecycle status, distinct from "Ready".' },
    { term: 'Readiness', definition: 'Whether the Pod is currently able to serve traffic — separate from whether it is Running.' },
  ],
  diagram: {
    nodes: [
      { id: 'node', label: 'Node', sublabel: 'worker machine', depth: 0, kind: 'external' },
      { id: 'pod', label: 'Pod', sublabel: 'shared network + storage', depth: 1, kind: 'workload' },
      { id: 'c1', label: 'app container', depth: 2, kind: 'workload' },
      { id: 'c2', label: 'sidecar container', depth: 2, kind: 'workload' },
      { id: 'vol', label: 'Volume', sublabel: 'optional shared disk', depth: 2, kind: 'storage' },
    ],
    edges: [
      { from: 'node', to: 'pod', label: 'hosts' },
      { from: 'pod', to: 'c1' },
      { from: 'pod', to: 'c2' },
      { from: 'pod', to: 'vol', label: 'mounts' },
    ],
  },
  yamlFilename: 'pod.yaml',
  yaml: `apiVersion: v1
kind: Pod
metadata:
  name: hello-pod
  namespace: default
  labels:
    app: hello
spec:
  containers:
    - name: hello
      image: nginx:1.25
      resources:
        requests:
          cpu: "200m"
          memory: "128Mi"
`,
  yamlNotes: [
    { match: 'kind: Pod', note: 'The resource type. Kubernetes objects are all "kind + apiVersion + metadata + spec".' },
    { match: 'metadata.name', note: 'Must be unique within the namespace. This is how you refer to it later with kubectl.' },
    { match: 'labels', note: 'Arbitrary key/value tags. Services and controllers find Pods purely by matching labels — not by name.' },
    { match: 'resources.requests', note: 'What the scheduler reserves for this Pod on a Node. No request ≈ the scheduler treats it as needing almost nothing.' },
  ],
  challenge: {
    instructions:
      'Open the Manifest tab and click "kubectl apply -f pod.yaml" (or type it yourself in the Terminal) to create hello-pod. Then watch the Cluster panel: it must be scheduled onto a Node and reach Ready.',
    hints: [
      'The Manifest tab has an Apply button that runs the equivalent of kubectl apply -f for you.',
      'Switch to the Cluster panel and check the Nodes section — a Pending pod means the scheduler hasn\'t placed it yet, give it a tick.',
      'A pod chip turns solid green with a ✅ once it is both Running and Ready.',
    ],
    check: (state) => {
      const pod = Object.values(state.pods).find((p) => p.meta.namespace === 'default' && p.meta.name === 'hello-pod');
      if (!pod) return 'No Pod named "hello-pod" exists yet in the default namespace — apply the manifest first.';
      if (!pod.nodeName) return 'hello-pod exists but is still Pending — the scheduler hasn\'t placed it on a Node yet.';
      if (!pod.ready) return 'hello-pod is starting up but not Ready yet — give the simulator a couple more ticks.';
      return null;
    },
    successMessage: 'hello-pod is Running and Ready on a Node. You just created your first real Kubernetes object.',
  },
  quiz: [
    {
      question: 'Why does Kubernetes schedule at the Pod level instead of the container level?',
      options: [
        'Containers are too small to schedule individually',
        'Some containers must always be co-located and share network/storage, so the scheduling unit has to guarantee that',
        'It is a historical accident with no real benefit',
        'Pods are required by Docker',
      ],
      correctIndex: 1,
      explanation: 'Sidecars (proxies, log shippers, config reloaders) need to live on the same Node and share localhost + volumes with the main container — Pods make that a guarantee, not a hope.',
    },
    {
      question: 'If a Node hosting a bare, controller-less Pod crashes, what happens to that Pod?',
      options: [
        'Kubernetes automatically reschedules it on a healthy Node',
        'It is gone — nothing is watching a bare Pod to recreate it elsewhere',
        'It pauses until the Node comes back',
        'It is duplicated onto every remaining Node',
      ],
      correctIndex: 1,
      explanation: 'Bare Pods have no controller. Only something like a ReplicaSet or Deployment watches for missing replicas and creates new Pods — which is exactly why you rarely deploy bare Pods.',
    },
    {
      question: '"Running" and "Ready" are:',
      options: [
        'Exactly the same thing',
        'Ready implies Running, but a Running Pod is not necessarily Ready to serve traffic yet',
        'Ready happens before Running, always',
        'Unrelated fields with no ordering',
      ],
      correctIndex: 1,
      explanation: 'A container can be Running (process started) while still failing its readiness probe (e.g. still warming a cache) — Services only route traffic to Ready pods.',
    },
  ],
};
