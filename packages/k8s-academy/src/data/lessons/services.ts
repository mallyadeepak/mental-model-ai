import type { Lesson } from '../types';

export const servicesLesson: Lesson = {
  id: 'services',
  title: 'Services & Service Discovery',
  icon: '🔌',
  tagline: 'Pods are disposable and their IPs churn constantly. Services are the stable thing you actually connect to.',
  category: 'Networking',
  explanation: `
Every Pod gets its own IP address — but that IP is worthless to depend on. Pods get rescheduled, replaced during rollouts, scaled up and down; their IPs come and go constantly. If your frontend hard-coded a backend Pod's IP, it would break the moment that Pod was replaced. This is the exact problem a **Service** solves.

A Service is a stable virtual IP (\`ClusterIP\`) and DNS name that sits in front of a *set* of Pods, selected purely by label selector — the same mechanism ReplicaSets use to find their Pods. Traffic to the Service gets load-balanced across whichever Pods currently match the selector **and are Ready**. Not-ready Pods are automatically excluded from the rotation, which is the payoff of the readiness probes from the earlier lesson: a Pod mid-startup or mid-crash never receives traffic through its Service.

The list of currently-matching, currently-Ready Pod IPs behind a Service is called its **Endpoints** — and it's recomputed continuously, not once at creation time. Scale a Deployment from 3 to 6 replicas and its Service's endpoint list grows to 6 automatically, with no changes to the Service object itself. This decoupling — Services don't know or care how many Pods exist, or which ones — is what lets you scale, roll out, and heal your workload without ever touching client-facing networking config.

Kubernetes gives every Service type-specific reach:
- **ClusterIP** (default) — reachable only from inside the cluster. Most internal service-to-service traffic.
- **NodePort** — additionally opens a port on every Node, reachable from outside the cluster. A blunt tool, mostly superseded by...
- **LoadBalancer** — asks the cloud provider to provision an external load balancer pointed at the Service. The common way to expose something to the internet directly (Ingress, next lesson, is the more flexible alternative for HTTP).

### Under the hood

In a real cluster, \`kube-proxy\` runs on every Node and programs the OS networking layer (iptables or IPVS rules) so that traffic to a Service's ClusterIP gets transparently rewritten to one of its Endpoint Pod IPs — no proxy process is actually in the request path for the common case. Our simulator skips packet-level plumbing and just computes Endpoints live: \`getEndpoints()\` in \`src/engine/simulator.ts\` filters all Pods by namespace, label-selector match, and \`ready === true\`, every time you ask — try \`kubectl describe service\` below and watch the Endpoints line change as Pods become Ready.
`,
  keyTerms: [
    { term: 'Service', definition: 'A stable virtual IP + DNS name that load-balances to a dynamic, selector-matched set of Ready Pods.' },
    { term: 'ClusterIP', definition: 'The default Service type — a virtual IP reachable only from inside the cluster.' },
    { term: 'Endpoints', definition: 'The live, continuously recomputed list of Ready Pod IPs currently backing a Service.' },
    { term: 'kube-proxy', definition: 'The per-Node agent that programs networking rules so ClusterIP traffic reaches the right Pod.' },
    { term: 'NodePort / LoadBalancer', definition: 'Service types that additionally expose a Service outside the cluster.' },
  ],
  diagram: {
    nodes: [
      { id: 'client', label: 'Client Pod', depth: 0, kind: 'external' },
      { id: 'svc', label: 'Service', sublabel: 'stable ClusterIP', depth: 1, kind: 'network' },
      { id: 'p1', label: 'Pod (Ready)', depth: 2, kind: 'workload' },
      { id: 'p2', label: 'Pod (Ready)', depth: 2, kind: 'workload' },
      { id: 'p3', label: 'Pod (not Ready)', sublabel: 'excluded', depth: 2, kind: 'workload' },
    ],
    edges: [
      { from: 'client', to: 'svc', label: 'DNS + ClusterIP' },
      { from: 'svc', to: 'p1', label: 'endpoint' },
      { from: 'svc', to: 'p2', label: 'endpoint' },
    ],
  },
  yamlFilename: 'catalog.yaml',
  yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: catalog
  namespace: default
  labels:
    app: catalog
spec:
  replicas: 2
  selector:
    matchLabels:
      app: catalog
  template:
    metadata:
      labels:
        app: catalog
    spec:
      containers:
        - name: catalog
          image: myorg/catalog:1.0
          resources:
            requests:
              cpu: "100m"
              memory: "64Mi"
---
apiVersion: v1
kind: Service
metadata:
  name: catalog-svc
  namespace: default
spec:
  selector:
    app: catalog
  ports:
    - port: 80
      targetPort: 8080
`,
  yamlNotes: [
    { match: '---', note: 'The YAML document separator — one apply can create multiple objects at once, which is how you\'ll usually ship a Deployment + its Service together.' },
    { match: 'spec.selector', note: 'On the Service, this must match the Pod template\'s labels on the Deployment — that\'s the entire link between them, nothing else.' },
    { match: 'targetPort: 8080', note: 'The port the container actually listens on, which can differ from the Service\'s external port (80).' },
  ],
  challenge: {
    instructions:
      'Apply catalog.yaml (it creates a Deployment and a Service in one shot). Once the Pods are Ready, run "kubectl describe service catalog-svc" in the Terminal and confirm it lists 2 Endpoints.',
    hints: [
      'Apply from the Manifest tab — one file, two objects, separated by "---".',
      'Give the catalog Pods a few ticks to reach Ready before checking the Service.',
      'kubectl describe service catalog-svc shows an Endpoints line — it should list both Pod names once they\'re Ready.',
    ],
    check: (state) => {
      const svc = Object.values(state.services).find((s) => s.meta.namespace === 'default' && s.meta.name === 'catalog-svc');
      if (!svc) return 'No Service named "catalog-svc" found yet — apply catalog.yaml first.';
      const dep = Object.values(state.deployments).find((d) => d.meta.namespace === 'default' && d.meta.name === 'catalog');
      if (!dep) return 'catalog-svc exists but the catalog Deployment is missing — re-apply the full manifest.';
      const endpointCount = Object.values(state.pods).filter(
        (p) => p.meta.namespace === 'default' && p.ready && Object.entries(svc.selector).every(([k, v]) => p.meta.labels[k] === v)
      ).length;
      if (endpointCount < dep.replicas) return `catalog-svc currently has ${endpointCount}/${dep.replicas} Ready endpoints — give the Pods more time to become Ready.`;
      return null;
    },
    successMessage: 'catalog-svc has 2 live endpoints — traffic to its ClusterIP now load-balances across both Ready catalog Pods.',
  },
  quiz: [
    {
      question: 'Why shouldn\'t a client connect directly to a Pod IP instead of going through a Service?',
      options: [
        'Pod IPs are encrypted and cannot be dialed directly',
        'Pod IPs change constantly as Pods are replaced, rescheduled, or scaled — a Service gives you something stable to depend on instead',
        'Pods do not have IP addresses',
        'Direct Pod connections are rate-limited by Kubernetes',
      ],
      correctIndex: 1,
      explanation: 'Pods are inherently disposable. A Service\'s ClusterIP and DNS name stay constant even as the set of backing Pods changes entirely underneath it.',
    },
    {
      question: 'A Pod matches a Service\'s label selector but is not in its Endpoints list. Why?',
      options: [
        'The Pod is not currently Ready, so it is excluded from traffic',
        'The Service has a bug',
        'Endpoints only include the first 2 matching Pods',
        'The Pod needs to be restarted to register',
      ],
      correctIndex: 0,
      explanation: 'Endpoints = label-selector match AND Ready. A Pod that matches the selector but is still starting up (or crash-looping) is deliberately left out until it passes its readiness probe.',
    },
    {
      question: 'What is the minimum link between a Deployment and a Service that exposes it?',
      options: [
        'They must share the same metadata.name',
        'The Service\'s selector must match labels on the Deployment\'s Pod template',
        'They must be applied in the same YAML file',
        'The Service must list the Deployment\'s name explicitly in its spec',
      ],
      correctIndex: 1,
      explanation: 'That label-selector match is the entire relationship — Services have no concept of "Deployment" at all, only of the Pods currently matching their selector.',
    },
  ],
};
