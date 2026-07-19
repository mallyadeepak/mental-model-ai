import type { Lesson } from '../types';

export const probesLesson: Lesson = {
  id: 'probes',
  title: 'Health Checks (Probes)',
  icon: '💓',
  tagline: 'A Running container is not the same as a working container. Probes are how Kubernetes tells the difference.',
  category: 'Workloads',
  explanation: `
Kubernetes can only see whether your container's main process is alive from the *outside*. That's not the same as knowing whether your app is actually healthy — a web server process can be running while its event loop is deadlocked, or while it's still loading a 4GB model into memory and can't serve requests yet. **Probes** close that gap by letting you tell Kubernetes how to actually check.

There are two probes worth knowing cold, because they answer two very different questions:

- **Readiness probe** — "should this Pod receive traffic *right now*?" A failing readiness probe doesn't restart anything; it just pulls the Pod out of Service endpoints until it passes again. This is what makes slow-starting apps (loading caches, warming connections) safe to deploy without a thundering herd of failed requests hitting them.
- **Liveness probe** — "is this container so broken it needs a hard restart?" A failing liveness probe gets the container killed and restarted by the kubelet. This is your safety net for deadlocks and stuck states that a process-alive check would never catch.

When a container keeps failing and getting restarted, Kubernetes doesn't retry instantly forever — it applies **exponential backoff**, waiting longer between each restart attempt (capped around 5 minutes), and reports the Pod status as \`CrashLoopBackOff\`. That status is not itself the bug — it's Kubernetes telling you "I've given up retrying quickly because this keeps failing," which is your signal to go look at logs, not to panic-restart the cluster.

A subtlety worth internalizing: **liveness probes must be conservative**. A liveness probe that's too aggressive (too short a timeout, checking a dependency that's slow but not actually broken) causes Kubernetes to kill perfectly healthy containers — a self-inflicted outage. When in doubt, prefer readiness checks (which just reroute traffic, low blast radius) over liveness checks (which kill things, high blast radius).

### Under the hood

In real Kubernetes, the kubelet runs these checks on a timer directly against each container (HTTP GET, TCP connect, or exec a command) and reports results back to the API server. Our simulator compresses this into two knobs on each container: \`readinessDelay\` (ticks until first Ready) and \`livenessFailAfter\` (ticks of healthy time before a simulated crash). Any image tag containing "broken", "crash", "bad", or ":fail" triggers a simulated liveness failure — that's what you're about to intentionally deploy.
`,
  keyTerms: [
    { term: 'Readiness probe', definition: "Failing pulls the Pod out of Service endpoints (no traffic) without restarting it." },
    { term: 'Liveness probe', definition: "Failing gets the container killed and restarted by the kubelet." },
    { term: 'CrashLoopBackOff', definition: 'Status shown when a container keeps crashing; Kubernetes backs off, waiting longer between each restart attempt.' },
    { term: 'Exponential backoff', definition: 'A restart-delay strategy that increases the wait time after each consecutive failure, capped at a maximum.' },
    { term: 'Restart count', definition: 'How many times a container has been restarted — a fast-climbing number is your first symptom of a crash loop.' },
  ],
  diagram: {
    nodes: [
      { id: 'kubelet', label: 'kubelet', sublabel: 'runs probes on a timer', depth: 0, kind: 'control' },
      { id: 'ready', label: 'Readiness probe', depth: 1, kind: 'concept' },
      { id: 'live', label: 'Liveness probe', depth: 1, kind: 'concept' },
      { id: 'svc', label: 'Service endpoints', sublabel: 'only Ready pods', depth: 2, kind: 'network' },
      { id: 'restart', label: 'Container restart', sublabel: 'CrashLoopBackOff', depth: 2, kind: 'workload' },
    ],
    edges: [
      { from: 'kubelet', to: 'ready', label: 'checks' },
      { from: 'kubelet', to: 'live', label: 'checks' },
      { from: 'ready', to: 'svc', label: 'fail → removed' },
      { from: 'live', to: 'restart', label: 'fail → killed' },
    ],
  },
  yamlFilename: 'worker-deployment.yaml',
  yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: worker
  namespace: default
  labels:
    app: worker
spec:
  replicas: 2
  selector:
    matchLabels:
      app: worker
  template:
    metadata:
      labels:
        app: worker
    spec:
      containers:
        - name: worker
          image: myorg/worker:broken
          resources:
            requests:
              cpu: "100m"
              memory: "64Mi"
          readinessProbe:
            initialDelaySeconds: 2
          livenessProbe:
            initialDelaySeconds: 5
`,
  yamlNotes: [
    { match: ':broken', note: 'This sandbox treats any image tag containing "broken"/"crash"/"bad"/":fail" as failing its liveness probe — a deliberate bug to fix.' },
    { match: 'readinessProbe', note: 'Configures how long after Running the container waits before its first readiness check.' },
    { match: 'livenessProbe', note: 'A real one would define httpGet/tcpSocket/exec checks — this sandbox just simulates pass/fail based on the image tag.' },
  ],
  challenge: {
    instructions:
      'Apply worker-deployment.yaml and watch the Cluster panel — the Pods will boot, briefly go Ready, then crash into CrashLoopBackOff (💥). Fix it: change the image tag to something without "broken" (e.g. myorg/worker:1.0), re-apply (or use kubectl set image), and get both replicas stably Ready.',
    hints: [
      'Apply the broken manifest first and watch it crash-loop in the Cluster panel — that\'s expected, not an error on your part.',
      'Edit the image line in the Manifest tab to myorg/worker:1.0 and click apply again.',
      'Or do it imperatively from the Terminal: kubectl set image deployment/worker worker=myorg/worker:1.0',
    ],
    check: (state) => {
      const dep = Object.values(state.deployments).find((d) => d.meta.namespace === 'default' && d.meta.name === 'worker');
      if (!dep) return 'No Deployment named "worker" found yet — apply the manifest first.';
      const pods = Object.values(state.pods).filter((p) => p.meta.namespace === 'default' && p.meta.labels['app'] === 'worker' && p.phase !== 'Terminating');
      const crashing = pods.some((p) => p.phase === 'CrashLoopBackOff' || p.restartCount > 0 && !p.ready);
      const ready = pods.filter((p) => p.ready).length;
      if (crashing) return 'At least one worker Pod is crash-looping — fix the image tag (remove "broken") and re-apply.';
      if (ready < dep.replicas) return `${ready}/${dep.replicas} replicas Ready — give the fixed Pods a couple more ticks.`;
      return null;
    },
    successMessage: 'Both worker replicas are stably Ready — the liveness probe stopped firing once the bad image was replaced.',
  },
  quiz: [
    {
      question: 'A Pod is Running but never shows up in a Service\'s endpoints. What is the most likely cause?',
      options: [
        'The Pod is on the wrong Node',
        'It is failing its readiness probe, so it is intentionally excluded from receiving traffic',
        'Services only route to the first Pod created',
        'The Pod needs to be manually added to the Service',
      ],
      correctIndex: 1,
      explanation: 'Service endpoints are computed only from Ready Pods matching the selector. Running-but-not-Ready is a normal, expected state during warmup — it just means "don\'t send traffic yet."',
    },
    {
      question: 'Why should liveness probes generally be more conservative (harder to fail) than readiness probes?',
      options: [
        'Liveness probes are checked less often so it does not matter',
        'A failing liveness probe kills the container — an overly aggressive check causes self-inflicted restarts of healthy containers',
        'Liveness probes cannot be configured with timeouts',
        'There is no meaningful difference in blast radius between the two',
      ],
      correctIndex: 1,
      explanation: 'Readiness failures just reroute traffic (low risk); liveness failures kill and restart the container (high risk) — so liveness checks should only fire for genuinely unrecoverable states.',
    },
    {
      question: 'What does CrashLoopBackOff actually mean?',
      options: [
        'The Pod was deleted by an administrator',
        'The container keeps crashing and Kubernetes is waiting increasingly longer between restart attempts',
        'The Node ran out of disk space',
        'The image could not be found in the registry',
      ],
      correctIndex: 1,
      explanation: 'It is a backoff state, not the root cause itself — the real bug is whatever is making the container exit or fail its liveness probe repeatedly; check logs and events to find it.',
    },
  ],
};
