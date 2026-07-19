import type {
  ClusterState,
  ConfigMap,
  Deployment,
  EventLogEntry,
  Ingress,
  Job,
  CronJob,
  NodeResource,
  ObjectMeta,
  Pod,
  PodTemplateSpec,
  ReplicaSet,
  Secret,
  Service,
} from './types';
import { resourceKey } from './types';
import {
  makeMeta,
  nextUid,
  parseConfigMap,
  parseCronJob,
  parseDaemonSet,
  parseDeployment,
  parseIngress,
  parseJob,
  parseSecret,
  parseService,
  parseStatefulSet,
  ManifestError,
} from './parse';

const DEFAULT_NAMESPACES = ['default', 'kube-system'];

export function createInitialState(): ClusterState {
  const nodes: NodeResource[] = [
    { name: 'node-1', allocatableCpu: 2000, allocatableMemory: 4096, ready: true },
    { name: 'node-2', allocatableCpu: 2000, allocatableMemory: 4096, ready: true },
    { name: 'node-3', allocatableCpu: 2000, allocatableMemory: 4096, ready: true },
  ];
  return {
    clock: 0,
    running: false,
    nodes,
    pods: {},
    replicaSets: {},
    deployments: {},
    services: {},
    configMaps: {},
    secrets: {},
    jobs: {},
    cronJobs: {},
    ingresses: {},
    daemonSets: {},
    statefulSets: {},
    namespaces: [...DEFAULT_NAMESPACES],
    events: [],
    nextIp: 1,
    uidCounter: 0,
  };
}

export function templateHash(template: PodTemplateSpec): string {
  const s = JSON.stringify({ labels: template.labels, containers: template.containers });
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h.toString(36).slice(0, 6).padStart(6, '0');
}

function pushEvent(
  state: ClusterState,
  type: EventLogEntry['type'],
  reason: string,
  message: string,
  involvedObject: string
): void {
  state.events.push({ tick: state.clock, type, reason, message, involvedObject });
  if (state.events.length > 300) state.events.splice(0, state.events.length - 300);
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export interface ApplyResult {
  state: ClusterState;
  applied: { kind: string; name: string; action: 'created' | 'configured' }[];
  errors: string[];
}

/** kubectl apply -f semantics: create-or-update each doc. */
export function applyManifestDocs(state: ClusterState, docs: any[]): ApplyResult {
  let next = clone(state);
  const applied: ApplyResult['applied'] = [];
  const errors: string[] = [];

  for (const raw of docs) {
    if (!raw || typeof raw !== 'object' || !raw.kind) continue;
    try {
      switch (raw.kind) {
        case 'Namespace': {
          const name = raw.metadata?.name;
          if (name && !next.namespaces.includes(name)) next.namespaces.push(name);
          applied.push({ kind: 'namespace', name, action: 'created' });
          break;
        }
        case 'Deployment': {
          const parsed = parseDeployment(raw, next.clock);
          const key = resourceKey('Deployment', parsed.meta.namespace, parsed.meta.name);
          const existing = next.deployments[key];
          if (!ensureNamespace(next, parsed.meta.namespace)) break;
          if (existing) {
            existing.replicas = parsed.replicas;
            existing.selector = parsed.selector;
            existing.template = parsed.template;
            existing.strategy = parsed.strategy;
            existing.meta.labels = parsed.meta.labels;
            applied.push({ kind: 'deployment', name: parsed.meta.name, action: 'configured' });
          } else {
            const dep: Deployment = {
              kind: 'Deployment',
              meta: parsed.meta,
              replicas: parsed.replicas,
              selector: parsed.selector,
              template: parsed.template,
              strategy: parsed.strategy,
              revision: 1,
              history: [],
            };
            next.deployments[key] = dep;
            applied.push({ kind: 'deployment', name: parsed.meta.name, action: 'created' });
            pushEvent(next, 'Normal', 'DeploymentCreated', `Deployment ${dep.meta.name} created`, key);
          }
          break;
        }
        case 'Service': {
          const parsed = parseService(raw, next.clock);
          const key = resourceKey('Service', parsed.meta.namespace, parsed.meta.name);
          if (!ensureNamespace(next, parsed.meta.namespace)) break;
          const existing = next.services[key];
          const svc: Service = existing
            ? { ...existing, selector: parsed.selector, ports: parsed.ports, type: parsed.type }
            : { ...parsed, clusterIP: `10.96.${Math.floor(next.nextIp / 254)}.${(next.nextIp % 254) + 1}` };
          if (!existing) next.nextIp += 1;
          next.services[key] = svc;
          applied.push({ kind: 'service', name: parsed.meta.name, action: existing ? 'configured' : 'created' });
          break;
        }
        case 'ConfigMap': {
          const cm = parseConfigMap(raw, next.clock);
          const key = resourceKey('ConfigMap', cm.meta.namespace, cm.meta.name);
          if (!ensureNamespace(next, cm.meta.namespace)) break;
          const action = next.configMaps[key] ? 'configured' : 'created';
          next.configMaps[key] = { ...cm, meta: { ...cm.meta, uid: next.configMaps[key]?.meta.uid ?? cm.meta.uid } };
          applied.push({ kind: 'configmap', name: cm.meta.name, action });
          break;
        }
        case 'Secret': {
          const secret = parseSecret(raw, next.clock);
          const key = resourceKey('Secret', secret.meta.namespace, secret.meta.name);
          if (!ensureNamespace(next, secret.meta.namespace)) break;
          const action = next.secrets[key] ? 'configured' : 'created';
          next.secrets[key] = secret;
          applied.push({ kind: 'secret', name: secret.meta.name, action });
          break;
        }
        case 'Job': {
          const parsed = parseJob(raw, next.clock);
          const key = resourceKey('Job', parsed.meta.namespace, parsed.meta.name);
          if (!ensureNamespace(next, parsed.meta.namespace)) break;
          if (!next.jobs[key]) {
            next.jobs[key] = { ...parsed, succeeded: 0, active: 0, startedTick: next.clock, completed: false };
            applied.push({ kind: 'job', name: parsed.meta.name, action: 'created' });
            pushEvent(next, 'Normal', 'JobCreated', `Job ${parsed.meta.name} created`, key);
          } else {
            applied.push({ kind: 'job', name: parsed.meta.name, action: 'configured' });
          }
          break;
        }
        case 'CronJob': {
          const parsed = parseCronJob(raw, next.clock);
          const key = resourceKey('CronJob', parsed.meta.namespace, parsed.meta.name);
          if (!ensureNamespace(next, parsed.meta.namespace)) break;
          if (!next.cronJobs[key]) {
            next.cronJobs[key] = { ...parsed, lastRunTick: next.clock, runCount: 0 };
            applied.push({ kind: 'cronjob', name: parsed.meta.name, action: 'created' });
          } else {
            applied.push({ kind: 'cronjob', name: parsed.meta.name, action: 'configured' });
          }
          break;
        }
        case 'DaemonSet': {
          const parsed = parseDaemonSet(raw, next.clock);
          const key = resourceKey('DaemonSet', parsed.meta.namespace, parsed.meta.name);
          if (!ensureNamespace(next, parsed.meta.namespace)) break;
          const existing = next.daemonSets[key];
          if (existing) {
            existing.template = parsed.template;
            applied.push({ kind: 'daemonset', name: parsed.meta.name, action: 'configured' });
          } else {
            next.daemonSets[key] = parsed;
            applied.push({ kind: 'daemonset', name: parsed.meta.name, action: 'created' });
          }
          break;
        }
        case 'StatefulSet': {
          const parsed = parseStatefulSet(raw, next.clock);
          const key = resourceKey('StatefulSet', parsed.meta.namespace, parsed.meta.name);
          if (!ensureNamespace(next, parsed.meta.namespace)) break;
          const existing = next.statefulSets[key];
          if (existing) {
            existing.replicas = parsed.replicas;
            existing.template = parsed.template;
            applied.push({ kind: 'statefulset', name: parsed.meta.name, action: 'configured' });
          } else {
            next.statefulSets[key] = parsed;
            applied.push({ kind: 'statefulset', name: parsed.meta.name, action: 'created' });
          }
          break;
        }
        case 'Ingress': {
          const ing = parseIngress(raw, next.clock);
          const key = resourceKey('Ingress', ing.meta.namespace, ing.meta.name);
          if (!ensureNamespace(next, ing.meta.namespace)) break;
          const action = next.ingresses[key] ? 'configured' : 'created';
          next.ingresses[key] = ing;
          applied.push({ kind: 'ingress', name: ing.meta.name, action });
          break;
        }
        case 'Pod': {
          const meta = makeMeta(raw, next.clock);
          if (!ensureNamespace(next, meta.namespace)) break;
          const containers = (raw.spec?.containers || []).map((c: any) => ({
            name: c.name,
            image: c.image,
            cpu: 100,
            memory: 128,
            readinessDelay: 1,
          }));
          const key = resourceKey('Pod', meta.namespace, meta.name);
          next.pods[key] = {
            kind: 'Pod',
            meta,
            containers,
            phase: 'Pending',
            ready: false,
            restartCount: 0,
            podHash: 'manual',
            logs: [],
          };
          applied.push({ kind: 'pod', name: meta.name, action: 'created' });
          break;
        }
        default:
          errors.push(`Unsupported kind: ${raw.kind} (this academy simulates Deployment, Service, ConfigMap, Secret, Job, CronJob, Ingress, Pod, Namespace)`);
      }
    } catch (e) {
      errors.push(e instanceof ManifestError ? e.message : String(e));
    }
  }

  return { state: next, applied, errors };
}

function ensureNamespace(state: ClusterState, ns: string): boolean {
  if (!state.namespaces.includes(ns)) {
    state.namespaces.push(ns);
  }
  return true;
}

// ---------- Actions ----------

export function scaleDeployment(state: ClusterState, ns: string, name: string, replicas: number): ClusterState {
  const next = clone(state);
  const key = resourceKey('Deployment', ns, name);
  const dep = next.deployments[key];
  if (dep) {
    dep.replicas = Math.max(0, replicas);
    pushEvent(next, 'Normal', 'ScalingReplicaSet', `Scaled deployment ${name} to ${replicas} replicas`, key);
  }
  return next;
}

export function setImage(state: ClusterState, ns: string, name: string, container: string, image: string): ClusterState {
  const next = clone(state);
  const key = resourceKey('Deployment', ns, name);
  const dep = next.deployments[key];
  if (dep) {
    const c = dep.template.containers.find((c) => c.name === container);
    if (c) {
      c.image = image;
      const troubled = /broken|crash|bad|:fail/.test(image);
      c.livenessFailAfter = troubled ? 3 : undefined;
      pushEvent(next, 'Normal', 'ImageUpdated', `Set image of ${container} to ${image}`, key);
    }
  }
  return next;
}

export function rolloutRestart(state: ClusterState, ns: string, name: string): ClusterState {
  const next = clone(state);
  const key = resourceKey('Deployment', ns, name);
  const dep = next.deployments[key];
  if (dep) {
    dep.template = { ...dep.template, labels: { ...dep.template.labels, restartedAt: String(next.clock) } };
    pushEvent(next, 'Normal', 'RolloutRestart', `Restarted deployment ${name}`, key);
  }
  return next;
}

export function rolloutUndo(state: ClusterState, ns: string, name: string): { state: ClusterState; message: string } {
  const next = clone(state);
  const key = resourceKey('Deployment', ns, name);
  const dep = next.deployments[key];
  if (!dep) return { state: next, message: `deployment.apps "${name}" not found` };
  const currentHash = templateHash(dep.template);
  const priorEntries = dep.history.filter((h) => h.podHash !== currentHash);
  if (priorEntries.length === 0) return { state: next, message: `error: no rollout history found for deployment "${name}"` };
  const prev = priorEntries[priorEntries.length - 1];
  dep.template = clone(prev.template);
  pushEvent(next, 'Normal', 'RolloutUndo', `Rolled back deployment ${name} to revision ${prev.revision}`, key);
  return { state: next, message: `deployment.apps/${name} rolled back` };
}

export function deleteResource(state: ClusterState, kind: string, ns: string, name: string): ClusterState {
  const next = clone(state);
  const key = resourceKey(kind, ns, name);
  switch (kind) {
    case 'Deployment':
      delete next.deployments[key];
      // Cascade: mark owned replicasets to scale to 0 (garbage collected on next reconcile).
      Object.values(next.replicaSets).forEach((rs) => {
        if (rs.meta.ownerRef?.kind === 'Deployment' && rs.meta.ownerRef.name === name && rs.meta.namespace === ns) {
          rs.replicas = 0;
        }
      });
      break;
    case 'Pod':
      delete next.pods[key];
      break;
    case 'Service':
      delete next.services[key];
      break;
    case 'ConfigMap':
      delete next.configMaps[key];
      break;
    case 'Secret':
      delete next.secrets[key];
      break;
    case 'Job': {
      delete next.jobs[key];
      Object.keys(next.pods).forEach((pk) => {
        const p = next.pods[pk];
        if (p.meta.ownerRef?.kind === 'Job' && p.meta.ownerRef.name === name && p.meta.namespace === ns) delete next.pods[pk];
      });
      break;
    }
    case 'CronJob':
      delete next.cronJobs[key];
      break;
    case 'Ingress':
      delete next.ingresses[key];
      break;
    case 'DaemonSet': {
      delete next.daemonSets[key];
      Object.keys(next.pods).forEach((pk) => {
        const p = next.pods[pk];
        if (p.meta.ownerRef?.kind === 'DaemonSet' && p.meta.ownerRef.name === name && p.meta.namespace === ns) delete next.pods[pk];
      });
      break;
    }
    case 'StatefulSet': {
      delete next.statefulSets[key];
      Object.keys(next.pods).forEach((pk) => {
        const p = next.pods[pk];
        if (p.meta.ownerRef?.kind === 'StatefulSet' && p.meta.ownerRef.name === name && p.meta.namespace === ns) delete next.pods[pk];
      });
      break;
    }
  }
  pushEvent(next, 'Normal', 'Deleted', `${kind} ${name} deleted`, key);
  return next;
}

export function deletePod(state: ClusterState, ns: string, name: string): ClusterState {
  const next = clone(state);
  const key = resourceKey('Pod', ns, name);
  if (next.pods[key]) {
    delete next.pods[key];
    pushEvent(next, 'Normal', 'Killing', `Pod ${name} deleted`, key);
  }
  return next;
}

export function podsForOwner(state: ClusterState, kind: string, ns: string, name: string): Pod[] {
  return Object.values(state.pods).filter(
    (p) => p.meta.namespace === ns && p.meta.ownerRef?.kind === kind && p.meta.ownerRef?.name === name
  );
}

export function getEndpoints(state: ClusterState, svc: Service): Pod[] {
  return Object.values(state.pods).filter(
    (p) =>
      p.meta.namespace === svc.meta.namespace &&
      p.ready &&
      Object.entries(svc.selector).every(([k, v]) => p.meta.labels[k] === v)
  );
}

// ---------- Reconcile loop (the "controllers") ----------

function nodeUsage(state: ClusterState, nodeName: string): { cpu: number; memory: number } {
  let cpu = 0;
  let memory = 0;
  for (const p of Object.values(state.pods)) {
    if (p.nodeName === nodeName && p.phase !== 'Terminating' && p.phase !== 'Completed' && p.phase !== 'Failed') {
      for (const c of p.containers) {
        cpu += c.cpu;
        memory += c.memory;
      }
    }
  }
  return { cpu, memory };
}

function scheduleNode(state: ClusterState, pod: Pod): string | undefined {
  const need = pod.containers.reduce(
    (acc, c) => ({ cpu: acc.cpu + c.cpu, memory: acc.memory + c.memory }),
    { cpu: 0, memory: 0 }
  );
  for (const node of state.nodes) {
    if (!node.ready) continue;
    const used = nodeUsage(state, node.name);
    if (node.allocatableCpu - used.cpu >= need.cpu && node.allocatableMemory - used.memory >= need.memory) {
      return node.name;
    }
  }
  return undefined;
}

function newPodMeta(namespace: string, generateName: string, labels: Record<string, string>, tick: number, owner: { kind: string; name: string }): ObjectMeta {
  const suffix = nextUid().replace('uid-', '');
  return {
    name: `${generateName}-${suffix}`,
    namespace,
    labels,
    uid: nextUid(),
    creationTick: tick,
    ownerRef: owner,
  };
}

function reconcileDeployments(state: ClusterState): void {
  for (const dep of Object.values(state.deployments)) {
    const desiredHash = templateHash(dep.template);
    const ownedRS = Object.values(state.replicaSets).filter(
      (rs) => rs.meta.ownerRef?.kind === 'Deployment' && rs.meta.ownerRef.name === dep.meta.name && rs.meta.namespace === dep.meta.namespace
    );
    let newRS = ownedRS.find((rs) => rs.podHash === desiredHash);
    if (!newRS) {
      dep.revision += 1;
      dep.history.push({ revision: dep.revision, podHash: desiredHash, template: clone(dep.template) });
      if (dep.history.length > 10) dep.history.shift();
      const key = resourceKey('ReplicaSet', dep.meta.namespace, `${dep.meta.name}-${desiredHash}`);
      newRS = {
        kind: 'ReplicaSet',
        meta: {
          name: `${dep.meta.name}-${desiredHash}`,
          namespace: dep.meta.namespace,
          labels: { ...dep.selector, 'pod-template-hash': desiredHash },
          uid: nextUid(),
          creationTick: state.clock,
          ownerRef: { kind: 'Deployment', name: dep.meta.name },
        },
        replicas: 0,
        template: clone(dep.template),
        podHash: desiredHash,
        selector: { ...dep.selector, 'pod-template-hash': desiredHash },
      };
      state.replicaSets[key] = newRS;
      pushEvent(state, 'Normal', 'ScalingReplicaSet', `Created ${newRS.meta.name}`, key);
    }

    const oldRSs = ownedRS.filter((rs) => rs.podHash !== desiredHash && rs.replicas > 0);

    if (dep.strategy === 'Recreate') {
      if (oldRSs.length > 0) {
        oldRSs.forEach((rs) => (rs.replicas = 0));
      } else if (newRS.replicas < dep.replicas) {
        newRS.replicas = dep.replicas;
      }
    } else {
      // RollingUpdate: step surge/unavailable by 1 pod per tick for a visible, legible animation.
      if (newRS.replicas < dep.replicas) newRS.replicas += 1;
      else if (newRS.replicas > dep.replicas) newRS.replicas -= 1;
      for (const rs of oldRSs) {
        rs.replicas = Math.max(0, rs.replicas - 1);
      }
    }
  }
}

function reconcileReplicaSets(state: ClusterState): void {
  for (const rs of Object.values(state.replicaSets)) {
    const owned = Object.values(state.pods).filter(
      (p) =>
        p.meta.namespace === rs.meta.namespace &&
        p.meta.ownerRef?.kind === 'ReplicaSet' &&
        p.meta.ownerRef.name === rs.meta.name &&
        p.phase !== 'Terminating'
    );
    const diff = rs.replicas - owned.length;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        const meta = newPodMeta(rs.meta.namespace, rs.meta.name, rs.template.labels, state.clock, {
          kind: 'ReplicaSet',
          name: rs.meta.name,
        });
        const key = resourceKey('Pod', meta.namespace, meta.name);
        state.pods[key] = {
          kind: 'Pod',
          meta,
          containers: clone(rs.template.containers),
          phase: 'Pending',
          ready: false,
          restartCount: 0,
          podHash: rs.podHash,
          logs: [`Pod ${meta.name} created by ReplicaSet ${rs.meta.name}`],
        };
      }
    } else if (diff < 0) {
      const toRemove = owned.slice(0, -diff);
      for (const p of toRemove) {
        p.phase = 'Terminating';
      }
    }
  }
  // Garbage collect ReplicaSets with 0 replicas, 0 pods, that are old (keep most recent for rollback though).
}

function tickPods(state: ClusterState): void {
  for (const key of Object.keys(state.pods)) {
    const p = state.pods[key];
    if (p.phase === 'Terminating') {
      delete state.pods[key];
      continue;
    }
    if (p.phase === 'Pending') {
      if (p.nodeName) {
        // Pre-bound (e.g. DaemonSet pods bind directly to a specific node, bypassing bin-packing).
        p.phase = 'ContainerCreating';
        continue;
      }
      const node = scheduleNode(state, p);
      if (node) {
        p.nodeName = node;
        p.phase = 'ContainerCreating';
        p.pendingReason = undefined;
        p.logs.push(`Scheduled to ${node}`);
        pushEvent(state, 'Normal', 'Scheduled', `Successfully assigned ${p.meta.name} to ${node}`, key);
      } else if (p.pendingReason !== 'Insufficient resources') {
        p.pendingReason = 'Insufficient resources';
        pushEvent(state, 'Warning', 'FailedScheduling', `0/${state.nodes.length} nodes available: insufficient cpu/memory`, key);
      }
      continue;
    }
    if (p.phase === 'ContainerCreating') {
      p.phase = 'Running';
      p.runningSinceTick = state.clock;
      p.logs.push('Container started');
      pushEvent(state, 'Normal', 'Started', `Started container(s) in ${p.meta.name}`, key);
      continue;
    }
    if (p.phase === 'Running') {
      // Job pods: run to completion instead of readiness.
      if (p.meta.ownerRef?.kind === 'Job') {
        const job = Object.values(state.jobs).find((j) => j.meta.name === p.meta.ownerRef!.name && j.meta.namespace === p.meta.namespace);
        const dur = job?.durationTicks ?? 3;
        if (p.runningSinceTick != null && state.clock - p.runningSinceTick >= dur) {
          p.phase = 'Completed';
          p.logs.push('Job completed successfully');
          pushEvent(state, 'Normal', 'Completed', `Pod ${p.meta.name} completed`, key);
        }
        continue;
      }

      const maxReadiness = Math.max(...p.containers.map((c) => c.readinessDelay ?? 1));
      const livenessFail = p.containers.find((c) => c.livenessFailAfter != null)?.livenessFailAfter;

      if (!p.ready && p.runningSinceTick != null && state.clock - p.runningSinceTick >= maxReadiness) {
        p.ready = true;
        p.readySinceTick = state.clock;
        p.logs.push('Readiness probe succeeded');
        pushEvent(state, 'Normal', 'Ready', `Pod ${p.meta.name} is Ready`, key);
      }

      if (livenessFail != null && p.readySinceTick != null && state.clock - p.readySinceTick >= livenessFail) {
        p.phase = 'CrashLoopBackOff';
        p.ready = false;
        p.restartCount += 1;
        p.backoffUntilTick = state.clock + Math.min(2 + p.restartCount * 2, 12);
        p.logs.push(`Liveness probe failed, container crashed (restart #${p.restartCount})`);
        pushEvent(state, 'Warning', 'BackOff', `Back-off restarting failed container in ${p.meta.name}`, key);
      }
      continue;
    }
    if (p.phase === 'CrashLoopBackOff') {
      if (p.backoffUntilTick != null && state.clock >= p.backoffUntilTick) {
        p.phase = 'ContainerCreating';
        p.logs.push('Restarting container after back-off');
      }
      continue;
    }
  }
}

function reconcileJobs(state: ClusterState): void {
  for (const job of Object.values(state.jobs)) {
    const owned = podsForOwner(state, 'Job', job.meta.namespace, job.meta.name);
    job.succeeded = owned.filter((p) => p.phase === 'Completed').length;
    job.active = owned.filter((p) => p.phase !== 'Completed' && p.phase !== 'Failed').length;
    if (job.succeeded >= job.completions) {
      if (!job.completed) {
        job.completed = true;
        pushEvent(state, 'Normal', 'Completed', `Job ${job.meta.name} completed ${job.succeeded}/${job.completions}`, resourceKey('Job', job.meta.namespace, job.meta.name));
      }
      continue;
    }
    const slots = Math.min(job.parallelism, job.completions - job.succeeded) - job.active;
    for (let i = 0; i < slots; i++) {
      const meta = newPodMeta(job.meta.namespace, job.meta.name, job.template.labels, state.clock, { kind: 'Job', name: job.meta.name });
      const key = resourceKey('Pod', meta.namespace, meta.name);
      state.pods[key] = {
        kind: 'Pod',
        meta,
        containers: clone(job.template.containers),
        phase: 'Pending',
        ready: false,
        restartCount: 0,
        podHash: 'job',
        logs: [`Pod ${meta.name} created by Job ${job.meta.name}`],
      };
      job.active += 1;
    }
  }
}

function reconcileCronJobs(state: ClusterState): void {
  for (const cj of Object.values(state.cronJobs)) {
    if (state.clock - cj.lastRunTick >= cj.everyTicks) {
      cj.lastRunTick = state.clock;
      cj.runCount += 1;
      const jobName = `${cj.meta.name}-${state.clock}`;
      const key = resourceKey('Job', cj.meta.namespace, jobName);
      state.jobs[key] = {
        kind: 'Job',
        meta: {
          name: jobName,
          namespace: cj.meta.namespace,
          labels: { ...cj.template.labels },
          uid: nextUid(),
          creationTick: state.clock,
          ownerRef: { kind: 'CronJob', name: cj.meta.name },
        },
        completions: 1,
        parallelism: 1,
        template: clone(cj.template),
        succeeded: 0,
        active: 0,
        durationTicks: 2,
        startedTick: state.clock,
        completed: false,
      };
      pushEvent(state, 'Normal', 'SuccessfulCreate', `CronJob ${cj.meta.name} scheduled job ${jobName}`, resourceKey('CronJob', cj.meta.namespace, cj.meta.name));
    }
  }
}

function reconcileDaemonSets(state: ClusterState): void {
  for (const ds of Object.values(state.daemonSets)) {
    for (const node of state.nodes) {
      const existing = Object.values(state.pods).find(
        (p) =>
          p.meta.namespace === ds.meta.namespace &&
          p.meta.ownerRef?.kind === 'DaemonSet' &&
          p.meta.ownerRef.name === ds.meta.name &&
          p.nodeName === node.name &&
          p.phase !== 'Terminating'
      );
      if (!existing) {
        const name = `${ds.meta.name}-${node.name}`;
        const meta = {
          name,
          namespace: ds.meta.namespace,
          labels: { ...ds.template.labels },
          uid: nextUid(),
          creationTick: state.clock,
          ownerRef: { kind: 'DaemonSet', name: ds.meta.name },
        };
        const key = resourceKey('Pod', meta.namespace, name);
        state.pods[key] = {
          kind: 'Pod',
          meta,
          containers: clone(ds.template.containers),
          nodeName: node.name,
          phase: 'Pending',
          ready: false,
          restartCount: 0,
          podHash: 'daemon',
          logs: [`Pod ${name} created by DaemonSet ${ds.meta.name}, pinned to ${node.name}`],
        };
      }
    }
  }
}

function reconcileStatefulSets(state: ClusterState): void {
  for (const sts of Object.values(state.statefulSets)) {
    const owned = podsForOwner(state, 'StatefulSet', sts.meta.namespace, sts.meta.name);
    const byOrdinal = new Map<number, Pod>();
    owned.forEach((p) => {
      const m = /-(\d+)$/.exec(p.meta.name);
      if (m) byOrdinal.set(parseInt(m[1], 10), p);
    });

    // Scale up strictly in order: pod i is only created once pod i-1 is Ready.
    for (let i = 0; i < sts.replicas; i++) {
      if (byOrdinal.has(i)) continue;
      const prevReady = i === 0 || Boolean(byOrdinal.get(i - 1)?.ready);
      if (!prevReady) break;
      const name = `${sts.meta.name}-${i}`;
      const meta = {
        name,
        namespace: sts.meta.namespace,
        labels: { ...sts.template.labels },
        uid: nextUid(),
        creationTick: state.clock,
        ownerRef: { kind: 'StatefulSet', name: sts.meta.name },
      };
      const key = resourceKey('Pod', meta.namespace, name);
      state.pods[key] = {
        kind: 'Pod',
        meta,
        containers: clone(sts.template.containers),
        phase: 'Pending',
        ready: false,
        restartCount: 0,
        podHash: 'sts',
        logs: [`Pod ${name} created by StatefulSet ${sts.meta.name} (ordinal ${i})`],
      };
      break;
    }

    // Scale down in reverse order: highest ordinal goes first.
    const ordinals = [...byOrdinal.keys()];
    if (ordinals.length) {
      const maxOrdinal = Math.max(...ordinals);
      if (maxOrdinal >= sts.replicas) {
        const p = byOrdinal.get(maxOrdinal);
        if (p) p.phase = 'Terminating';
      }
    }
  }
}

/** Advance the simulated cluster by one tick, running all controllers once (mirrors real controller-manager loops). */
export function reconcile(state: ClusterState): ClusterState {
  const next = clone(state);
  next.clock += 1;
  reconcileDeployments(next);
  reconcileReplicaSets(next);
  reconcileDaemonSets(next);
  reconcileStatefulSets(next);
  reconcileJobs(next);
  reconcileCronJobs(next);
  tickPods(next);

  // Garbage collect ReplicaSets that are empty, unused, and not the newest for their deployment.
  for (const key of Object.keys(next.replicaSets)) {
    const rs = next.replicaSets[key];
    if (rs.replicas === 0) {
      const hasPods = podsForOwner(next, 'ReplicaSet', rs.meta.namespace, rs.meta.name).length > 0;
      const dep = rs.meta.ownerRef ? next.deployments[resourceKey('Deployment', rs.meta.namespace, rs.meta.ownerRef.name)] : undefined;
      const isCurrent = dep ? templateHash(dep.template) === rs.podHash : false;
      if (!hasPods && !isCurrent && state.clock - rs.meta.creationTick > 15) {
        delete next.replicaSets[key];
      }
    }
  }

  return next;
}
