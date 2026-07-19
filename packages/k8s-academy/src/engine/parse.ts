// Converts parsed YAML plain objects (Kubernetes-manifest shaped) into
// the simulator's internal resource shapes.

import type {
  ConfigMap,
  ContainerSpec,
  CronJob,
  Deployment,
  Ingress,
  Job,
  ObjectMeta,
  PodTemplateSpec,
  Secret,
  Service,
  ServicePort,
} from './types';

export class ManifestError extends Error {}

function parseCpu(v: unknown): number {
  if (v == null) return 100;
  const s = String(v);
  if (s.endsWith('m')) return parseInt(s, 10) || 100;
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.round(n * 1000) : 100;
}

function parseMemory(v: unknown): number {
  if (v == null) return 128;
  const s = String(v);
  if (s.endsWith('Gi')) return (parseFloat(s) || 0.125) * 1024;
  if (s.endsWith('Mi')) return parseFloat(s) || 128;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 128;
}

let uidSeq = 1;
export function nextUid(): string {
  uidSeq += 1;
  return `uid-${uidSeq.toString(36)}`;
}

export function makeMeta(raw: any, tick: number): ObjectMeta {
  const metadata = raw?.metadata ?? {};
  if (!metadata.name) throw new ManifestError('metadata.name is required');
  return {
    name: metadata.name,
    namespace: metadata.namespace || 'default',
    labels: metadata.labels || {},
    annotations: metadata.annotations || {},
    uid: nextUid(),
    creationTick: tick,
  };
}

export function parseContainers(raw: any): ContainerSpec[] {
  const containers = raw?.containers;
  if (!Array.isArray(containers) || containers.length === 0) {
    throw new ManifestError('spec.template.spec.containers must be a non-empty array');
  }
  return containers.map((c: any): ContainerSpec => {
    if (!c.name) throw new ManifestError('container.name is required');
    if (!c.image) throw new ManifestError(`container "${c.name}" is missing an image`);
    const requests = c.resources?.requests ?? {};
    const isTroubled = /broken|crash|bad|:fail/.test(String(c.image));
    return {
      name: c.name,
      image: c.image,
      cpu: parseCpu(requests.cpu),
      memory: parseMemory(requests.memory),
      readinessDelay: c.readinessProbe ? (c.readinessProbe.initialDelaySeconds ?? 2) : 1,
      livenessFailAfter: isTroubled ? 3 : c.livenessProbe ? undefined : undefined,
      env: Object.fromEntries((c.env || []).map((e: any) => [e.name, String(e.value ?? '')])),
    };
  });
}

export function parsePodTemplateSpec(raw: any): PodTemplateSpec {
  const template = raw?.template;
  if (!template) throw new ManifestError('spec.template is required');
  return {
    labels: template.metadata?.labels || {},
    containers: parseContainers(template.spec),
  };
}

export interface ParsedDeployment {
  kind: 'Deployment';
  meta: ObjectMeta;
  replicas: number;
  selector: Record<string, string>;
  template: PodTemplateSpec;
  strategy: 'RollingUpdate' | 'Recreate';
}

export function parseDeployment(raw: any, tick: number): ParsedDeployment {
  const meta = makeMeta(raw, tick);
  const spec = raw.spec || {};
  const template = parsePodTemplateSpec(spec);
  const selector = spec.selector?.matchLabels || template.labels || {};
  return {
    kind: 'Deployment',
    meta,
    replicas: spec.replicas ?? 1,
    selector,
    template,
    strategy: spec.strategy?.type === 'Recreate' ? 'Recreate' : 'RollingUpdate',
  };
}

export function parseService(raw: any, tick: number): Omit<Service, 'clusterIP'> {
  const meta = makeMeta(raw, tick);
  const spec = raw.spec || {};
  const ports: ServicePort[] = (spec.ports || [{ port: 80, targetPort: 80 }]).map((p: any) => ({
    port: p.port,
    targetPort: p.targetPort ?? p.port,
    protocol: p.protocol || 'TCP',
  }));
  return {
    kind: 'Service',
    meta,
    selector: spec.selector || {},
    ports,
    type: spec.type || 'ClusterIP',
  };
}

export function parseConfigMap(raw: any, tick: number): ConfigMap {
  return { kind: 'ConfigMap', meta: makeMeta(raw, tick), data: raw.data || {} };
}

export function parseSecret(raw: any, tick: number): Secret {
  return { kind: 'Secret', meta: makeMeta(raw, tick), data: raw.data || raw.stringData || {} };
}

export function parseJob(raw: any, tick: number): Omit<Job, 'succeeded' | 'active' | 'startedTick' | 'completed'> {
  const meta = makeMeta(raw, tick);
  const spec = raw.spec || {};
  const template = parsePodTemplateSpec(spec);
  return {
    kind: 'Job',
    meta,
    completions: spec.completions ?? 1,
    parallelism: spec.parallelism ?? 1,
    template,
    durationTicks: 3,
  };
}

export function parseCronJob(raw: any, tick: number): Omit<CronJob, 'lastRunTick' | 'runCount'> {
  const meta = makeMeta(raw, tick);
  const spec = raw.spec || {};
  const jobTemplate = spec.jobTemplate?.spec || {};
  const template = parsePodTemplateSpec(jobTemplate);
  const schedule = spec.schedule || '*/5 * * * *';
  // Simplified: interpret "*/N * * * *" as "every N ticks"; otherwise default 5.
  const match = /^\*\/(\d+)/.exec(schedule);
  const everyTicks = match ? Math.max(2, parseInt(match[1], 10)) : 5;
  return { kind: 'CronJob', meta, schedule, everyTicks, template };
}

export function parseDaemonSet(raw: any, tick: number): { kind: 'DaemonSet'; meta: ObjectMeta; template: PodTemplateSpec } {
  const meta = makeMeta(raw, tick);
  const template = parsePodTemplateSpec(raw.spec || {});
  return { kind: 'DaemonSet', meta, template };
}

export function parseStatefulSet(raw: any, tick: number): {
  kind: 'StatefulSet';
  meta: ObjectMeta;
  replicas: number;
  serviceName: string;
  template: PodTemplateSpec;
} {
  const meta = makeMeta(raw, tick);
  const spec = raw.spec || {};
  const template = parsePodTemplateSpec(spec);
  return { kind: 'StatefulSet', meta, replicas: spec.replicas ?? 1, serviceName: spec.serviceName || meta.name, template };
}

export function parseIngress(raw: any, tick: number): Ingress {
  const meta = makeMeta(raw, tick);
  const spec = raw.spec || {};
  const rule = (spec.rules || [])[0] || {};
  const paths = rule.http?.paths || [];
  return {
    kind: 'Ingress',
    meta,
    host: rule.host || 'app.example.com',
    rules: paths.map((p: any) => ({
      path: p.path || '/',
      serviceName: p.backend?.service?.name || p.backend?.serviceName,
      servicePort: p.backend?.service?.port?.number || p.backend?.servicePort || 80,
    })),
  };
}
