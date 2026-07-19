import type { Lesson } from '../types';

export const configLesson: Lesson = {
  id: 'config',
  title: 'ConfigMaps & Secrets',
  icon: '🗂️',
  tagline: 'Decouple "what your app does" from "how it\'s configured right now."',
  category: 'Configuration',
  explanation: `
Baking configuration into a container image is a trap: the same "build once, deploy anywhere" image you want for staging and production ends up needing two different images just because a database URL differs. **ConfigMaps** and **Secrets** exist to pull configuration out of the image entirely, so the exact same image can run anywhere with different config injected at deploy time.

They're structurally almost identical — both are simple key/value maps — and the difference is entirely about *intent and handling*, not encryption by default:
- **ConfigMap** — non-sensitive configuration: feature flags, URLs, log levels, anything fine to read in plaintext.
- **Secret** — sensitive data: passwords, API tokens, TLS keys. Values are base64-**encoded**, not encrypted, at rest by default (encryption-at-rest is a separate cluster-level setting an operator configures) — the real protection Secrets add is tighter RBAC defaults and being excluded from things like \`kubectl get -o yaml\` dumps of unrelated resources. Base64 is an encoding, not a cipher; never mistake "it's a Secret object" for "it's encrypted."

Both get **injected into Pods** in one of two ways:
- As **environment variables** — simple, but the Pod has to be recreated to pick up a change (env vars are only read at container start).
- As a **mounted volume** — each key becomes a file inside the container's filesystem. Kubernetes can update the mounted files live when the ConfigMap/Secret changes, though most apps still need a restart or a reload signal to actually notice.

This decoupling is what makes the exact same Deployment YAML portable across environments: swap which ConfigMap it references (or override values in a values file if you're using a templating tool like Helm/Kustomize) and nothing about the container image or the Deployment's shape changes at all.

### Under the hood

ConfigMaps and Secrets are just data objects with no controller behind them at all — no reconcile loop, nothing to "run." Their only job is to exist so the kubelet can read their values when starting a Pod that references them. That's reflected exactly in this simulator: applying one just stores it (see the \`ConfigMap\`/\`Secret\` cases in \`applyManifestDocs\`) — there's no lifecycle to animate, they're pure state.
`,
  keyTerms: [
    { term: 'ConfigMap', definition: 'A key/value object for non-sensitive configuration, injected into Pods as env vars or mounted files.' },
    { term: 'Secret', definition: 'Structurally like a ConfigMap but for sensitive data; base64-encoded (not encrypted) by default.' },
    { term: 'Env var injection', definition: 'Values read once at container start — a Pod restart is needed to pick up changes.' },
    { term: 'Volume mount injection', definition: 'Values appear as files in the container filesystem, which the kubelet can update live.' },
    { term: 'Base64 encoding', definition: 'Obfuscation, not encryption — a Secret\'s protection comes from RBAC and API restrictions, not the encoding itself.' },
  ],
  diagram: {
    nodes: [
      { id: 'cm', label: 'ConfigMap', sublabel: 'non-sensitive data', depth: 0, kind: 'storage' },
      { id: 'sec', label: 'Secret', sublabel: 'sensitive data', depth: 0, kind: 'storage' },
      { id: 'pod', label: 'Pod', depth: 1, kind: 'workload' },
      { id: 'env', label: 'env vars', sublabel: 'read at start', depth: 2, kind: 'concept' },
      { id: 'vol', label: 'mounted files', sublabel: 'can live-update', depth: 2, kind: 'concept' },
    ],
    edges: [
      { from: 'cm', to: 'pod', label: 'injected' },
      { from: 'sec', to: 'pod', label: 'injected' },
      { from: 'pod', to: 'env' },
      { from: 'pod', to: 'vol' },
    ],
  },
  yamlFilename: 'app-config.yaml',
  yaml: `apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: default
data:
  LOG_LEVEL: "info"
  FEATURE_NEW_CHECKOUT: "true"
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: default
data:
  DB_PASSWORD: c3VwZXJzZWNyZXQ=
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payments
  namespace: default
  labels:
    app: payments
spec:
  replicas: 2
  selector:
    matchLabels:
      app: payments
  template:
    metadata:
      labels:
        app: payments
    spec:
      containers:
        - name: payments
          image: myorg/payments:1.0
          resources:
            requests:
              cpu: "100m"
              memory: "64Mi"
          env:
            - name: LOG_LEVEL
              value: "info"
`,
  yamlNotes: [
    { match: 'data:', note: 'A plain key/value map on both ConfigMap and Secret — the object shapes are almost identical on purpose.' },
    { match: 'c3VwZXJzZWNyZXQ=', note: 'That\'s just base64("supersecret") — try decoding it. This is why Secrets alone are not "encryption."' },
    { match: 'env:', note: 'In a real cluster you would reference the ConfigMap/Secret by name here (valueFrom.configMapKeyRef) instead of hard-coding the value like this simplified example does.' },
  ],
  challenge: {
    instructions:
      'Apply app-config.yaml — it creates a ConfigMap, a Secret, and a payments Deployment together. Confirm with "kubectl get configmap" and "kubectl get secret" that both exist, and that payments reaches 2/2 Ready.',
    hints: [
      'kubectl get configmap and kubectl get secret both list what is in the default namespace.',
      'ConfigMaps and Secrets do not have a "Ready" state themselves — they are pure data, so just check they exist.',
      'The payments Deployment needs its own couple of ticks to reach 2/2 Ready, same as any Deployment.',
    ],
    check: (state) => {
      const cm = Object.values(state.configMaps).find((c) => c.meta.namespace === 'default' && c.meta.name === 'app-config');
      const sec = Object.values(state.secrets).find((c) => c.meta.namespace === 'default' && c.meta.name === 'app-secrets');
      const dep = Object.values(state.deployments).find((d) => d.meta.namespace === 'default' && d.meta.name === 'payments');
      if (!cm || !sec || !dep) return 'Apply app-config.yaml first — it should create app-config, app-secrets, and the payments Deployment together.';
      const ready = Object.values(state.pods).filter((p) => p.meta.namespace === 'default' && p.meta.labels['app'] === 'payments' && p.ready).length;
      if (ready < dep.replicas) return `payments is at ${ready}/${dep.replicas} Ready — give it a few more ticks.`;
      return null;
    },
    successMessage: 'app-config, app-secrets, and the payments Deployment are all live — configuration fully decoupled from the container image.',
  },
  quiz: [
    {
      question: 'What is the real difference in protection between a ConfigMap and a Secret, by default?',
      options: [
        'Secrets are fully encrypted at rest, ConfigMaps are not',
        'Secret values are only base64-encoded by default — real encryption-at-rest is a separate cluster configuration; the main default benefit is tighter access handling',
        'There is no difference at all',
        'ConfigMaps can only be read by root',
      ],
      correctIndex: 1,
      explanation: 'Base64 is an encoding, trivially reversible, not a cipher. Treating "it\'s a Secret object" as sufficient protection for genuinely sensitive data is a common and dangerous misconception.',
    },
    {
      question: 'You update a ConfigMap that a running Pod references as environment variables. What happens to that Pod?',
      options: [
        'The environment variables update live, instantly',
        'Nothing changes until the Pod is restarted — env vars are only read once, at container start',
        'The Pod is automatically deleted and recreated',
        'The change is rejected by the API server',
      ],
      correctIndex: 1,
      explanation: 'Env-var injection is a one-time read at startup. If you need live config updates without a restart, you need the volume-mount injection style instead (and app code that watches the file for changes).',
    },
  ],
};
