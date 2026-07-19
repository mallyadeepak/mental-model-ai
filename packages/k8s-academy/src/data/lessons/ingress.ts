import type { Lesson } from '../types';

export const ingressLesson: Lesson = {
  id: 'ingress',
  title: 'Ingress',
  icon: '🌐',
  tagline: 'One front door, many Services, routed by hostname and path.',
  category: 'Networking',
  explanation: `
A \`LoadBalancer\` Service is a fine way to expose one thing to the internet — but a real app is rarely one thing. You might have five internal Services (\`web\`, \`api\`, \`admin\`, \`docs\`, \`images\`) and provisioning a separate cloud load balancer for each is expensive and unwieldy. **Ingress** solves the "many HTTP services, one entry point" problem: it's a set of routing rules — by hostname and URL path — that map external requests to the right internal Service.

An Ingress object on its own does nothing. It's purely declarative routing *rules*; something called an **Ingress controller** (nginx-ingress, an Envoy-based one, a cloud provider's own — there are many implementations) actually watches Ingress objects and programs a real HTTP proxy/load balancer to match. This is the same pattern you've now seen a few times in Kubernetes: the API object is a declaration of intent, and a separate controller loop makes it real. Without an Ingress controller installed in your cluster, creating Ingress objects is a no-op.

A single Ingress can route:
- \`api.example.com\` → the \`api\` Service
- \`example.com/docs\` → the \`docs\` Service
- \`example.com/*\` → the \`web\` Service (a catch-all)

all through one external IP and one TLS certificate, instead of one of each per Service. This is why Ingress (or its successor, the newer **Gateway API**) is the standard way to expose HTTP(S) traffic in any cluster with more than a couple of externally-facing Services.

One easy mental trap: Ingress is an **HTTP/HTTPS-layer** concept — it understands hostnames and paths. For raw TCP/UDP traffic that isn't HTTP, you're back to \`NodePort\`/\`LoadBalancer\` Services (or a Gateway API \`TCPRoute\` in newer setups).

### Under the hood

This sandbox simulates the routing table an Ingress *declares* — host and path rules pointing at Service names and ports — without a live Ingress controller behind it (there's no real HTTP traffic to proxy in a browser sandbox). The important habit to build is reading the rule as "if this host+path, forward to this Service, which forwards to whichever Pods are currently Ready" — three layers of indirection, each one independently swappable.
`,
  keyTerms: [
    { term: 'Ingress', definition: 'Declarative HTTP(S) routing rules — hostname/path to Service — with no traffic-handling logic of its own.' },
    { term: 'Ingress controller', definition: 'The actual proxy/load balancer implementation (nginx, Envoy, cloud-native) that watches Ingress objects and enforces the rules.' },
    { term: 'Host-based routing', definition: 'Routing different hostnames (api.example.com vs. example.com) to different backend Services.' },
    { term: 'Path-based routing', definition: 'Routing different URL paths on the same hostname (/docs vs. /) to different backend Services.' },
    { term: 'Gateway API', definition: 'A newer, more expressive successor to Ingress for traffic routing, gaining adoption alongside it.' },
  ],
  diagram: {
    nodes: [
      { id: 'internet', label: 'Internet', depth: 0, kind: 'external' },
      { id: 'ing', label: 'Ingress', sublabel: 'host + path rules', depth: 1, kind: 'network' },
      { id: 'ctrl', label: 'Ingress controller', sublabel: 'e.g. nginx-ingress', depth: 1, kind: 'control' },
      { id: 'svc1', label: 'web Service', depth: 2, kind: 'network' },
      { id: 'svc2', label: 'api Service', depth: 2, kind: 'network' },
      { id: 'pods1', label: 'web Pods', depth: 3, kind: 'workload' },
      { id: 'pods2', label: 'api Pods', depth: 3, kind: 'workload' },
    ],
    edges: [
      { from: 'internet', to: 'ing', label: 'HTTPS request' },
      { from: 'ctrl', to: 'ing', label: 'watches + enforces' },
      { from: 'ing', to: 'svc1', label: '/' },
      { from: 'ing', to: 'svc2', label: '/api' },
      { from: 'svc1', to: 'pods1' },
      { from: 'svc2', to: 'pods2' },
    ],
  },
  yamlFilename: 'shop-ingress.yaml',
  yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: shop
  namespace: default
  labels:
    app: shop
spec:
  replicas: 2
  selector:
    matchLabels:
      app: shop
  template:
    metadata:
      labels:
        app: shop
    spec:
      containers:
        - name: shop
          image: myorg/shop:1.0
          resources:
            requests:
              cpu: "100m"
              memory: "64Mi"
---
apiVersion: v1
kind: Service
metadata:
  name: shop-svc
  namespace: default
spec:
  selector:
    app: shop
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop-ingress
  namespace: default
spec:
  rules:
    - host: shop.example.com
      http:
        paths:
          - path: /
            backend:
              service:
                name: shop-svc
                port:
                  number: 80
`,
  yamlNotes: [
    { match: 'host: shop.example.com', note: 'The hostname this rule matches — an Ingress can list several of these for different subdomains.' },
    { match: 'service.name: shop-svc', note: 'Ingress never points at Pods directly — always at a Service, which then finds the Ready Pods.' },
  ],
  challenge: {
    instructions:
      'Apply shop-ingress.yaml (it creates a Deployment, a Service, and an Ingress together). Confirm with "kubectl get ingress" that shop-ingress exists and routes shop.example.com to shop-svc, which has live endpoints.',
    hints: [
      'One apply, three objects — Deployment, Service, and Ingress can all live in one file.',
      'Run "kubectl get ingress" in the Terminal to see the host it is configured for.',
      'The underlying shop-svc needs Ready Pods behind it for the route to actually mean anything — give it a few ticks.',
    ],
    check: (state) => {
      const ing = Object.values(state.ingresses).find((i) => i.meta.namespace === 'default' && i.meta.name === 'shop-ingress');
      if (!ing) return 'No Ingress named "shop-ingress" found yet — apply shop-ingress.yaml first.';
      const svc = Object.values(state.services).find((s) => s.meta.namespace === 'default' && s.meta.name === 'shop-svc');
      if (!svc) return 'shop-ingress exists but shop-svc is missing — re-apply the full manifest.';
      const ready = Object.values(state.pods).filter(
        (p) => p.meta.namespace === 'default' && p.ready && Object.entries(svc.selector).every(([k, v]) => p.meta.labels[k] === v)
      ).length;
      if (ready === 0) return 'shop-svc has no Ready endpoints yet — give the shop Pods a few more ticks.';
      return null;
    },
    successMessage: 'shop-ingress is live: shop.example.com/ now routes through shop-svc to Ready shop Pods — a full external-request-to-Pod path.',
  },
  quiz: [
    {
      question: 'What actually happens if you create an Ingress object in a cluster with no Ingress controller installed?',
      options: [
        'Kubernetes automatically installs one for you',
        'The Ingress object is stored but nothing enforces its rules — no traffic is actually routed',
        'The apply fails with an error',
        'It falls back to acting like a LoadBalancer Service',
      ],
      correctIndex: 1,
      explanation: 'Ingress is purely a declaration of intent. Like other Kubernetes objects, it needs a controller watching and acting on it — without one, it just sits there as inert configuration.',
    },
    {
      question: 'Why use one Ingress with routing rules instead of a LoadBalancer Service per microservice?',
      options: [
        'LoadBalancer Services are deprecated',
        'Ingress is faster at the network layer',
        'One Ingress (and one external IP/certificate) can route many hostnames/paths to many Services, which is far cheaper and simpler to manage than one load balancer per service',
        'There is no real difference, it is purely a style preference',
      ],
      correctIndex: 2,
      explanation: 'Provisioning a cloud load balancer per Service gets expensive and hard to manage fast. Ingress consolidates HTTP(S) routing for many backend Services behind one entry point.',
    },
  ],
};
