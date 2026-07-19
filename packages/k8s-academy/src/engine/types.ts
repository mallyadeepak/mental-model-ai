// Core data model for the simulated Kubernetes cluster.
// Deliberately a simplified but faithful subset of real K8s object shapes,
// so the YAML users write/apply here looks like the real thing.

export type PodPhase =
  | 'Pending'
  | 'ContainerCreating'
  | 'Running'
  | 'CrashLoopBackOff'
  | 'Completed'
  | 'Failed'
  | 'Terminating';

export interface ObjectMeta {
  name: string;
  namespace: string;
  labels: Record<string, string>;
  annotations?: Record<string, string>;
  uid: string;
  creationTick: number;
  ownerRef?: { kind: string; name: string };
}

export interface ContainerSpec {
  name: string;
  image: string;
  cpu: number; // millicores requested, simplified single number
  memory: number; // MiB requested, simplified
  readinessDelay?: number; // ticks until ready after Running
  livenessFailAfter?: number; // ticks of "healthy time" before a liveness probe would fail (simulate crash)
  env?: Record<string, string>;
}

export interface PodTemplateSpec {
  labels: Record<string, string>;
  containers: ContainerSpec[];
}

export interface Pod {
  kind: 'Pod';
  meta: ObjectMeta;
  containers: ContainerSpec[];
  nodeName?: string;
  phase: PodPhase;
  ready: boolean;
  restartCount: number;
  podHash: string; // template hash, used to group under ReplicaSets
  readySinceTick?: number;
  runningSinceTick?: number;
  backoffUntilTick?: number;
  pendingReason?: string;
  logs: string[];
}

export interface ReplicaSet {
  kind: 'ReplicaSet';
  meta: ObjectMeta;
  replicas: number;
  template: PodTemplateSpec;
  podHash: string;
  selector: Record<string, string>;
}

export type DeploymentStrategy = 'RollingUpdate' | 'Recreate';

export interface Deployment {
  kind: 'Deployment';
  meta: ObjectMeta;
  replicas: number;
  selector: Record<string, string>;
  template: PodTemplateSpec;
  strategy: DeploymentStrategy;
  revision: number;
  history: { revision: number; podHash: string; template: PodTemplateSpec }[];
  paused?: boolean;
}

export interface ServicePort {
  port: number;
  targetPort: number;
  protocol?: 'TCP' | 'UDP';
}

export type ServiceType = 'ClusterIP' | 'NodePort' | 'LoadBalancer';

export interface Service {
  kind: 'Service';
  meta: ObjectMeta;
  selector: Record<string, string>;
  ports: ServicePort[];
  type: ServiceType;
  clusterIP: string;
}

export interface ConfigMap {
  kind: 'ConfigMap';
  meta: ObjectMeta;
  data: Record<string, string>;
}

export interface Secret {
  kind: 'Secret';
  meta: ObjectMeta;
  data: Record<string, string>;
}

export interface Job {
  kind: 'Job';
  meta: ObjectMeta;
  completions: number;
  parallelism: number;
  template: PodTemplateSpec;
  succeeded: number;
  active: number;
  durationTicks: number; // simulated ticks each pod takes to complete
  startedTick: number;
  completed: boolean;
}

export interface CronJob {
  kind: 'CronJob';
  meta: ObjectMeta;
  schedule: string; // human label like "every 5 ticks" (simplified, not real cron parsing)
  everyTicks: number;
  template: PodTemplateSpec;
  lastRunTick: number;
  runCount: number;
}

export interface DaemonSet {
  kind: 'DaemonSet';
  meta: ObjectMeta;
  template: PodTemplateSpec;
}

export interface StatefulSet {
  kind: 'StatefulSet';
  meta: ObjectMeta;
  replicas: number;
  serviceName: string;
  template: PodTemplateSpec;
}

export interface IngressRule {
  path: string;
  serviceName: string;
  servicePort: number;
}

export interface Ingress {
  kind: 'Ingress';
  meta: ObjectMeta;
  host: string;
  rules: IngressRule[];
}

export interface NodeResource {
  name: string;
  allocatableCpu: number;
  allocatableMemory: number;
  ready: boolean;
}

export interface EventLogEntry {
  tick: number;
  type: 'Normal' | 'Warning';
  reason: string;
  message: string;
  involvedObject: string;
}

export interface ClusterState {
  clock: number;
  running: boolean;
  nodes: NodeResource[];
  pods: Record<string, Pod>;
  replicaSets: Record<string, ReplicaSet>;
  deployments: Record<string, Deployment>;
  services: Record<string, Service>;
  configMaps: Record<string, ConfigMap>;
  secrets: Record<string, Secret>;
  jobs: Record<string, Job>;
  cronJobs: Record<string, CronJob>;
  ingresses: Record<string, Ingress>;
  daemonSets: Record<string, DaemonSet>;
  statefulSets: Record<string, StatefulSet>;
  namespaces: string[];
  events: EventLogEntry[];
  nextIp: number;
  uidCounter: number;
}

export type AnyResource =
  | Pod
  | ReplicaSet
  | Deployment
  | Service
  | ConfigMap
  | Secret
  | Job
  | CronJob
  | Ingress
  | DaemonSet
  | StatefulSet;

export function resourceKey(kind: string, namespace: string, name: string): string {
  return `${kind}/${namespace}/${name}`;
}
