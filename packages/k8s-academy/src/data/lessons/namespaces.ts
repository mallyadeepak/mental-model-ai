import type { Lesson } from '../types';

export const namespacesLesson: Lesson = {
  id: 'namespaces',
  title: 'Namespaces',
  icon: '🏷️',
  tagline: 'A virtual cluster inside your cluster — for names, quotas, and access control.',
  category: 'Configuration',
  explanation: `
A **Namespace** is a way to slice one physical cluster into multiple virtual ones. It's the scope for object *names* — you can have a Deployment named \`api\` in the \`staging\` namespace and an entirely separate Deployment also named \`api\` in \`production\`, in the same cluster, with zero conflict. Names only have to be unique **within** a namespace, not across the whole cluster.

The practical reasons teams reach for namespaces:
- **Environment separation** — \`dev\`, \`staging\`, \`production\` sharing one cluster without stepping on each other's object names.
- **Team/tenant isolation** — each team gets a namespace, and RBAC rules (\`Role\`/\`RoleBinding\`) grant permissions scoped to just that namespace.
- **Resource quotas** — a \`ResourceQuota\` object can cap total CPU/memory/object-count per namespace, so one noisy team can't starve the whole cluster.

Two things namespaces are commonly *mis*-assumed to provide, worth being precise about:
- **Not network isolation by default.** A Pod in \`namespace-a\` can talk to a Pod in \`namespace-b\` over the network unless you've explicitly deployed \`NetworkPolicy\` objects to restrict it. Namespaces are an API-object boundary, not automatically a network one.
- **Not all objects are namespaced.** Nodes, PersistentVolumes (the cluster-wide storage pool, as opposed to namespaced PersistentVolumeClaims), and Namespaces themselves are **cluster-scoped** — they exist outside any namespace, because they represent shared infrastructure, not per-team resources.

Every cluster starts with a few built-in namespaces, most notably \`default\` (where objects land if you don't specify one) and \`kube-system\` (where the cluster's own control-plane-adjacent components often live) — both of which you've already been using throughout this academy without necessarily noticing.

### Under the hood

A Namespace is, structurally, one of the simplest objects in the whole API — barely more than a name and a status. It has essentially no controller behavior of its own; its entire power comes from every *other* object carrying a \`metadata.namespace\` field, and from every other controller (schedulers, RBAC, quotas) scoping its work by that field. Our simulator mirrors this: \`state.namespaces\` is just a flat string list, and every resource map is keyed by \`kind/namespace/name\` — see \`resourceKey()\` in \`src/engine/types.ts\`.
`,
  keyTerms: [
    { term: 'Namespace', definition: "A virtual cluster-within-a-cluster; the scope for object name uniqueness." },
    { term: 'Cluster-scoped resources', definition: 'Objects like Nodes and Namespaces themselves that exist outside any namespace.' },
    { term: 'ResourceQuota', definition: 'Caps total CPU/memory/object counts a namespace is allowed to consume.' },
    { term: 'NetworkPolicy', definition: 'The object needed to actually restrict cross-namespace (or cross-Pod) network traffic — namespaces alone do not do this.' },
    { term: 'RBAC (Role/RoleBinding)', definition: 'Access-control objects almost always scoped to a specific namespace.' },
  ],
  diagram: {
    nodes: [
      { id: 'cluster', label: 'Cluster', depth: 0, kind: 'external' },
      { id: 'ns1', label: 'namespace: default', depth: 1, kind: 'concept' },
      { id: 'ns2', label: 'namespace: staging', depth: 1, kind: 'concept' },
      { id: 'api1', label: 'Deployment "api"', depth: 2, kind: 'workload' },
      { id: 'api2', label: 'Deployment "api"', sublabel: 'no conflict!', depth: 2, kind: 'workload' },
    ],
    edges: [
      { from: 'cluster', to: 'ns1' },
      { from: 'cluster', to: 'ns2' },
      { from: 'ns1', to: 'api1', label: 'contains' },
      { from: 'ns2', to: 'api2', label: 'contains' },
    ],
  },
  yamlFilename: 'staging.yaml',
  yaml: `apiVersion: v1
kind: Namespace
metadata:
  name: staging
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: staging
  labels:
    app: api
spec:
  replicas: 1
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
    { match: 'kind: Namespace', note: 'Creating the namespace before (or alongside) putting objects in it — kubectl apply processes documents in order.' },
    { match: 'namespace: staging', note: 'This api Deployment lives entirely separately from any "api" Deployment you may have created earlier in default.' },
  ],
  challenge: {
    instructions:
      'Apply staging.yaml to create the staging namespace and an "api" Deployment inside it. Switch the namespace selector in the Cluster panel to "staging" to watch it come up — completely separate from anything named "api" in default.',
    hints: [
      'Apply from the Manifest tab as usual — a Namespace object can be created in the same file as things that go inside it.',
      'Use the "ns:" dropdown at the top of the Cluster panel to switch your view to the staging namespace.',
      'kubectl get pods -n staging (or -A for all namespaces) also works from the Terminal.',
    ],
    check: (state) => {
      if (!state.namespaces.includes('staging')) return 'No "staging" namespace found yet — apply staging.yaml first.';
      const dep = Object.values(state.deployments).find((d) => d.meta.namespace === 'staging' && d.meta.name === 'api');
      if (!dep) return 'The staging namespace exists but its "api" Deployment is missing — re-apply the full manifest.';
      const ready = Object.values(state.pods).filter((p) => p.meta.namespace === 'staging' && p.meta.labels['app'] === 'api' && p.ready).length;
      if (ready < dep.replicas) return `api in staging is at ${ready}/${dep.replicas} Ready — give it a few more ticks.`;
      return null;
    },
    successMessage: 'The staging namespace is live with its own Ready "api" Deployment — fully isolated by name from anything else in the cluster.',
  },
  quiz: [
    {
      question: 'Two Deployments are both named "api" — one in namespace "staging", one in namespace "production". Is this allowed?',
      options: [
        'No, names must be unique across the entire cluster',
        'Yes — object names only need to be unique within a namespace, not across the whole cluster',
        'Only if they have different labels',
        'Only the Deployment created first is allowed to keep the name',
      ],
      correctIndex: 1,
      explanation: 'Namespace scoping is exactly what makes this possible — it is the single biggest practical reason teams use multiple namespaces for the same app across environments.',
    },
    {
      question: 'By default, can a Pod in namespace "a" send network traffic to a Pod in namespace "b"?',
      options: [
        'No, namespaces block all cross-namespace traffic automatically',
        'Yes — namespaces are not a network boundary by default; NetworkPolicy objects are required to restrict this',
        'Only if both namespaces have the same name prefix',
        'Only through an Ingress',
      ],
      correctIndex: 1,
      explanation: 'This is one of the most common Kubernetes misconceptions. Namespaces scope API object names and access control, but network reachability between Pods is open by default regardless of namespace, until you add NetworkPolicy rules.',
    },
  ],
};
