import type { Lesson } from '../types';

export const scalingLesson: Lesson = {
  id: 'scaling',
  title: 'Scaling',
  icon: '📈',
  tagline: 'Changing "how many" is just changing a number — the controllers handle the rest.',
  category: 'Workloads',
  explanation: `
Scaling a Deployment is, mechanically, one of the simplest operations in Kubernetes: change \`spec.replicas\`, and the ReplicaSet controller's reconcile loop (desired vs. current) does the rest — creating new Pods to scale up, or terminating existing ones to scale down. There's no special "scaling procedure"; it's the exact same loop that provides self-healing, just triggered by a different number.

You can change that number two ways, and it's worth knowing both:
- **Imperatively**, with \`kubectl scale deployment/web --replicas=5\` — fast, great for "I need more capacity right now," but the change lives only in the cluster, not in your source-controlled YAML.
- **Declaratively**, by editing \`replicas:\` in the manifest and re-applying — slower, but the desired state is captured in version control, which is what you want for anything you'll deploy again.

In production, both of those are usually replaced by a **HorizontalPodAutoscaler (HPA)**: an object that watches a metric (typically CPU or memory utilization, or a custom metric) and adjusts \`replicas\` automatically within a min/max range you set. It's not a different scaling mechanism — an HPA just becomes a third writer of \`spec.replicas\`, on a timer, based on load. This simulator doesn't model live CPU metrics, but the mental model is: HPA is to scaling what a thermostat is to a furnace — a feedback loop wrapped around the same knob you can already turn by hand.

Scaling down is worth a specific callout: when the ReplicaSet controller has to remove Pods, it terminates them — sending a shutdown signal and giving them a grace period — rather than yanking them mid-request. That grace period is what lets a well-behaved app finish in-flight work before exiting.

### Under the hood

There is no separate "ScaleController" — scaling is just a value change on an existing object, observed by the same \`reconcileReplicaSets()\` loop that already runs on every tick. Try it yourself below: watch how a scale-down doesn't remove Pods instantly but marks them \`Terminating\` first, exactly mirroring the real grace-period behavior.
`,
  keyTerms: [
    { term: 'spec.replicas', definition: 'The single field that drives scaling — imperative kubectl scale and declarative YAML edits both just change this.' },
    { term: 'Imperative scaling', definition: 'kubectl scale — fast, immediate, but not recorded in your source-controlled manifests.' },
    { term: 'Declarative scaling', definition: 'Editing replicas in YAML and re-applying — slower, but the desired state lives in version control.' },
    { term: 'HorizontalPodAutoscaler (HPA)', definition: 'An object that automatically adjusts replicas based on observed metrics like CPU utilization.' },
    { term: 'Graceful termination', definition: "A Pod being scaled down gets a shutdown grace period instead of being killed instantly." },
  ],
  diagram: {
    nodes: [
      { id: 'hpa', label: 'HPA (optional)', sublabel: 'watches CPU %', depth: 0, kind: 'control' },
      { id: 'you', label: 'You', sublabel: 'kubectl scale / edit YAML', depth: 0, kind: 'external' },
      { id: 'replicas', label: 'spec.replicas', depth: 1, kind: 'concept' },
      { id: 'rs', label: 'ReplicaSet controller', depth: 2, kind: 'control' },
      { id: 'pods', label: 'Pods created/removed', depth: 3, kind: 'workload' },
    ],
    edges: [
      { from: 'hpa', to: 'replicas', label: 'writes' },
      { from: 'you', to: 'replicas', label: 'writes' },
      { from: 'replicas', to: 'rs', label: 'observed' },
      { from: 'rs', to: 'pods', label: 'reconciles' },
    ],
  },
  yamlFilename: 'api-deployment.yaml',
  yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: default
  labels:
    app: api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: myorg/api:1.0
          resources:
            requests:
              cpu: "100m"
              memory: "64Mi"
`,
  yamlNotes: [
    { match: 'replicas: 2', note: 'The starting point — you\'ll scale this up imperatively without touching this file.' },
  ],
  challenge: {
    instructions:
      'Apply api-deployment.yaml to create the "api" Deployment with 2 replicas. Then, in the Terminal, scale it up imperatively: kubectl scale deployment/api --replicas=4. Watch 2 more Pods appear without editing any YAML.',
    hints: [
      'Apply the manifest from the Manifest tab first.',
      'Switch to the Terminal and run: kubectl scale deployment/api --replicas=4',
      'Give it a few ticks in the Cluster panel — you should see 4/4 ready under the api Deployment.',
    ],
    check: (state) => {
      const dep = Object.values(state.deployments).find((d) => d.meta.namespace === 'default' && d.meta.name === 'api');
      if (!dep) return 'No Deployment named "api" found yet — apply api-deployment.yaml first.';
      if (dep.replicas < 4) return `api is currently set to ${dep.replicas} replicas — scale it up to at least 4 with "kubectl scale deployment/api --replicas=4".`;
      const ready = Object.values(state.pods).filter((p) => p.meta.namespace === 'default' && p.meta.labels['app'] === 'api' && p.ready).length;
      if (ready < dep.replicas) return `${ready}/${dep.replicas} replicas Ready — give it a few more ticks.`;
      return null;
    },
    successMessage: 'The api Deployment is scaled to 4/4 Ready replicas — purely by changing a number, with zero new YAML written to disk.',
  },
  quiz: [
    {
      question: 'What actually changes when you run "kubectl scale deployment/web --replicas=5"?',
      options: [
        'A brand new Deployment is created',
        'The replicas field on the existing Deployment is updated, which the ReplicaSet controller then reconciles',
        'Kubernetes clones 5 new Nodes',
        'Nothing until you also re-apply the YAML file',
      ],
      correctIndex: 1,
      explanation: 'Scaling is just a field update. The exact same reconcile loop that provides self-healing (desired vs. current Pod count) picks up the new number and closes the gap.',
    },
    {
      question: 'What is the relationship between a HorizontalPodAutoscaler and kubectl scale?',
      options: [
        'They are unrelated, completely different mechanisms',
        'HPA replaces the scheduler entirely',
        'HPA is a feedback loop that writes to the same replicas field kubectl scale writes to, just automatically based on metrics',
        'HPA only works on Jobs, not Deployments',
      ],
      correctIndex: 2,
      explanation: 'HPA doesn\'t have a separate scaling mechanism — it periodically computes a target replica count from observed metrics and writes it, exactly like you would by hand.',
    },
  ],
};
