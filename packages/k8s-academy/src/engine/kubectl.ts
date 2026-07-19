import YAML from 'yaml';
import type { ClusterState, Pod } from './types';
import { resourceKey } from './types';
import {
  applyManifestDocs,
  deletePod,
  deleteResource,
  getEndpoints,
  podsForOwner,
  rolloutRestart,
  rolloutUndo,
  scaleDeployment,
  setImage,
  templateHash,
} from './simulator';

export interface TerminalContext {
  state: ClusterState;
  files: Record<string, string>;
  namespace: string;
}

export interface TerminalResult {
  state: ClusterState;
  files: Record<string, string>;
  namespace: string;
  output: string[];
  clear?: boolean;
}

function table(headers: string[], rows: string[][]): string[] {
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => (r[i] || '').length)));
  const fmt = (cols: string[]) => cols.map((c, i) => c.padEnd(widths[i] + 2)).join('').trimEnd();
  return [fmt(headers), ...rows.map(fmt)];
}

function age(state: ClusterState, createdTick: number): string {
  return `${state.clock - createdTick}t`;
}

function flag(tokens: string[], name: string): string | undefined {
  const eq = tokens.find((t) => t.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const idx = tokens.indexOf(name);
  if (idx >= 0 && tokens[idx + 1]) return tokens[idx + 1];
  return undefined;
}

function has(tokens: string[], name: string): boolean {
  return tokens.includes(name);
}

function nsOf(tokens: string[], fallback: string): string {
  return flag(tokens, '-n') || flag(tokens, '--namespace') || fallback;
}

function podStatusLine(state: ClusterState, p: Pod): string[] {
  const readyCount = p.ready || p.phase === 'Completed' ? p.containers.length : 0;
  return [
    p.meta.name,
    `${readyCount}/${p.containers.length}`,
    p.phase,
    String(p.restartCount),
    age(state, p.meta.creationTick),
  ];
}

const EXPLAIN: Record<string, string> = {
  pod: 'Pod: the smallest deployable unit. One or more containers that share network + storage, scheduled onto a single Node together.',
  deployment: 'Deployment: declares a desired Pod template + replica count. Owns ReplicaSets, which own Pods. Handles rolling updates and rollback history.',
  replicaset: 'ReplicaSet: ensures a specified number of Pod replicas matching a label selector are running at all times. Usually managed for you by a Deployment.',
  service: 'Service: a stable virtual IP + DNS name that load-balances traffic to a dynamic set of Pods selected by labels — the answer to "Pods die, how do clients find them?"',
  configmap: 'ConfigMap: non-secret configuration data (key/value pairs) that can be injected into Pods as env vars or mounted files, decoupling config from image.',
  secret: 'Secret: like a ConfigMap but for sensitive data (tokens, passwords, keys), base64-encoded at rest and access-controlled.',
  job: 'Job: runs Pods to completion (batch work) instead of keeping them running forever. Tracks successful completions.',
  cronjob: 'CronJob: creates Jobs on a repeating time schedule, like cron for your cluster.',
  ingress: 'Ingress: HTTP(S) routing rules that map external hostnames/paths to internal Services — your cluster\'s reverse proxy config.',
  namespace: 'Namespace: a virtual cluster-within-a-cluster used to scope names, quotas, and access control for a group of resources.',
  node: 'Node: a worker machine (VM or bare metal) in the cluster with CPU/memory capacity that the scheduler places Pods onto.',
  daemonset: 'DaemonSet: ensures exactly one copy of a Pod runs on every (or every matching) Node — for node-level agents like log collectors or monitoring shims.',
  statefulset: 'StatefulSet: like a Deployment, but for Pods that need a stable identity and ordered, one-at-a-time startup/shutdown — for databases and other stateful systems.',
};

export function executeCommand(input: string, ctx: TerminalContext): TerminalResult {
  const raw = input.trim();
  if (!raw) return { ...ctx, output: [] };
  let tokens = raw.split(/\s+/);
  if (tokens[0] === 'kubectl' || tokens[0] === 'k') tokens = tokens.slice(1);
  const cmd = tokens[0];
  let state = ctx.state;
  let files = ctx.files;
  let namespace = ctx.namespace;
  const out: string[] = [];

  const kindMap: Record<string, string> = {
    pod: 'Pod', pods: 'Pod', po: 'Pod',
    deployment: 'Deployment', deployments: 'Deployment', deploy: 'Deployment',
    service: 'Service', services: 'Service', svc: 'Service',
    replicaset: 'ReplicaSet', replicasets: 'ReplicaSet', rs: 'ReplicaSet',
    configmap: 'ConfigMap', configmaps: 'ConfigMap', cm: 'ConfigMap',
    secret: 'Secret', secrets: 'Secret',
    job: 'Job', jobs: 'Job',
    cronjob: 'CronJob', cronjobs: 'CronJob', cj: 'CronJob',
    ingress: 'Ingress', ingresses: 'Ingress', ing: 'Ingress',
    daemonset: 'DaemonSet', daemonsets: 'DaemonSet', ds: 'DaemonSet',
    statefulset: 'StatefulSet', statefulsets: 'StatefulSet', sts: 'StatefulSet',
    namespace: 'Namespace', namespaces: 'Namespace', ns: 'Namespace',
    node: 'Node', nodes: 'Node', no: 'Node',
    event: 'Event', events: 'Event', ev: 'Event',
  };

  switch (cmd) {
    case undefined:
      break;
    case 'help': {
      out.push(
        'Available commands (this is a simulated cluster, not a real one):',
        '  kubectl get <pods|deployments|services|replicasets|configmaps|secrets|jobs|cronjobs|ingress|nodes|events|all> [-n ns] [-A]',
        '  kubectl describe <resource> <name> [-n ns]',
        '  kubectl apply -f <file>',
        '  kubectl delete <resource> <name> | kubectl delete -f <file>',
        '  kubectl scale deployment/<name> --replicas=N',
        '  kubectl logs <pod>',
        '  kubectl rollout status|undo|restart deployment/<name>',
        '  kubectl set image deployment/<name> <container>=<image>',
        '  kubectl expose deployment/<name> --port=P [--target-port=T] [--name=N]',
        '  kubectl explain <resource>',
        '  ls, cat <file>, clear'
      );
      break;
    }
    case 'clear':
      return { state, files, namespace, output: [], clear: true };
    case 'ls': {
      out.push(...Object.keys(files));
      break;
    }
    case 'cat': {
      const f = tokens[1];
      if (!f || !files[f]) out.push(`cat: ${f || ''}: No such file`);
      else out.push(...files[f].split('\n'));
      break;
    }
    case 'get': {
      const kindWord = tokens[1];
      if (!kindWord) {
        out.push('error: you must specify the resource type to get. e.g. kubectl get pods');
        break;
      }
      const allNs = has(tokens, '-A') || has(tokens, '--all-namespaces');
      const ns = allNs ? undefined : nsOf(tokens, namespace);
      const nameArg = tokens[2] && !tokens[2].startsWith('-') ? tokens[2] : undefined;

      const inNs = (n: string) => allNs || n === ns;

      if (kindWord === 'all') {
        out.push('-- deployments --');
        out.push(...renderDeployments(state, ns, allNs));
        out.push('', '-- pods --');
        out.push(...renderPods(state, ns, allNs));
        out.push('', '-- services --');
        out.push(...renderServices(state, ns, allNs));
        break;
      }
      const kind = kindMap[kindWord];
      if (!kind) {
        out.push(`error: the server doesn't have a resource type "${kindWord}"`);
        break;
      }
      switch (kind) {
        case 'Pod':
          out.push(...renderPods(state, ns, allNs, nameArg));
          break;
        case 'Deployment':
          out.push(...renderDeployments(state, ns, allNs, nameArg));
          break;
        case 'Service':
          out.push(...renderServices(state, ns, allNs, nameArg));
          break;
        case 'ReplicaSet':
          out.push(
            ...table(
              ['NAME', 'DESIRED', 'CURRENT', 'AGE'],
              Object.values(state.replicaSets)
                .filter((rs) => inNs(rs.meta.namespace) && (!nameArg || rs.meta.name === nameArg))
                .map((rs) => [rs.meta.name, String(rs.replicas), String(podsForOwner(state, 'ReplicaSet', rs.meta.namespace, rs.meta.name).length), age(state, rs.meta.creationTick)])
            )
          );
          break;
        case 'ConfigMap':
          out.push(
            ...table(
              ['NAME', 'DATA', 'AGE'],
              Object.values(state.configMaps)
                .filter((c) => inNs(c.meta.namespace) && (!nameArg || c.meta.name === nameArg))
                .map((c) => [c.meta.name, String(Object.keys(c.data).length), age(state, c.meta.creationTick)])
            )
          );
          break;
        case 'Secret':
          out.push(
            ...table(
              ['NAME', 'TYPE', 'DATA', 'AGE'],
              Object.values(state.secrets)
                .filter((c) => inNs(c.meta.namespace) && (!nameArg || c.meta.name === nameArg))
                .map((c) => [c.meta.name, 'Opaque', String(Object.keys(c.data).length), age(state, c.meta.creationTick)])
            )
          );
          break;
        case 'Job':
          out.push(
            ...table(
              ['NAME', 'COMPLETIONS', 'AGE'],
              Object.values(state.jobs)
                .filter((j) => inNs(j.meta.namespace) && (!nameArg || j.meta.name === nameArg))
                .map((j) => [j.meta.name, `${j.succeeded}/${j.completions}`, age(state, j.meta.creationTick)])
            )
          );
          break;
        case 'CronJob':
          out.push(
            ...table(
              ['NAME', 'SCHEDULE', 'RUNS', 'AGE'],
              Object.values(state.cronJobs)
                .filter((j) => inNs(j.meta.namespace) && (!nameArg || j.meta.name === nameArg))
                .map((j) => [j.meta.name, j.schedule, String(j.runCount), age(state, j.meta.creationTick)])
            )
          );
          break;
        case 'Ingress':
          out.push(
            ...table(
              ['NAME', 'HOSTS', 'AGE'],
              Object.values(state.ingresses)
                .filter((i) => inNs(i.meta.namespace) && (!nameArg || i.meta.name === nameArg))
                .map((i) => [i.meta.name, i.host, age(state, i.meta.creationTick)])
            )
          );
          break;
        case 'DaemonSet':
          out.push(
            ...table(
              ['NAME', 'DESIRED', 'READY', 'AGE'],
              Object.values(state.daemonSets)
                .filter((d) => inNs(d.meta.namespace) && (!nameArg || d.meta.name === nameArg))
                .map((d) => {
                  const pods = podsForOwner(state, 'DaemonSet', d.meta.namespace, d.meta.name);
                  return [d.meta.name, String(state.nodes.length), String(pods.filter((p) => p.ready).length), age(state, d.meta.creationTick)];
                })
            )
          );
          break;
        case 'StatefulSet':
          out.push(
            ...table(
              ['NAME', 'READY', 'AGE'],
              Object.values(state.statefulSets)
                .filter((d) => inNs(d.meta.namespace) && (!nameArg || d.meta.name === nameArg))
                .map((d) => {
                  const pods = podsForOwner(state, 'StatefulSet', d.meta.namespace, d.meta.name);
                  return [d.meta.name, `${pods.filter((p) => p.ready).length}/${d.replicas}`, age(state, d.meta.creationTick)];
                })
            )
          );
          break;
        case 'Namespace':
          out.push(...table(['NAME', 'STATUS'], state.namespaces.map((n) => [n, 'Active'])));
          break;
        case 'Node':
          out.push(
            ...table(
              ['NAME', 'STATUS', 'CPU', 'MEMORY'],
              state.nodes.map((n) => [n.name, n.ready ? 'Ready' : 'NotReady', `${n.allocatableCpu}m`, `${n.allocatableMemory}Mi`])
            )
          );
          break;
        case 'Event':
          out.push(
            ...table(
              ['TICK', 'TYPE', 'REASON', 'OBJECT', 'MESSAGE'],
              state.events.slice(-30).map((e) => [String(e.tick), e.type, e.reason, e.involvedObject, e.message])
            )
          );
          break;
      }
      break;
    }
    case 'describe': {
      const kindWord = tokens[1];
      const name = tokens[2];
      const ns = nsOf(tokens, namespace);
      const kind = kindMap[kindWord];
      if (!kind || !name) {
        out.push('error: usage: kubectl describe <resource> <name>');
        break;
      }
      out.push(...describeResource(state, kind, ns, name));
      break;
    }
    case 'logs': {
      const name = tokens[1];
      const ns = nsOf(tokens, namespace);
      const pod = state.pods[resourceKey('Pod', ns, name)];
      if (!pod) out.push(`Error from server (NotFound): pods "${name}" not found`);
      else out.push(...(pod.logs.length ? pod.logs : ['(no logs yet)']));
      break;
    }
    case 'apply': {
      const fileArg = flag(tokens, '-f');
      if (!fileArg) {
        out.push('error: must specify -f <file>');
        break;
      }
      const content = files[fileArg];
      if (content == null) {
        out.push(`error: the path "${fileArg}" does not exist in this sandbox filesystem. Try: ls`);
        break;
      }
      try {
        const docs = YAML.parseAllDocuments(content).map((d) => d.toJSON());
        const result = applyManifestDocs(state, docs);
        state = result.state;
        result.applied.forEach((a) => out.push(`${a.kind}.apps/${a.name} ${a.action}`));
        result.errors.forEach((e) => out.push(`error: ${e}`));
        if (result.applied.length === 0 && result.errors.length === 0) out.push('nothing to apply');
      } catch (e) {
        out.push(`error parsing ${fileArg}: ${(e as Error).message}`);
      }
      break;
    }
    case 'delete': {
      const fileArg = flag(tokens, '-f');
      if (fileArg) {
        const content = files[fileArg];
        if (content == null) {
          out.push(`error: the path "${fileArg}" does not exist`);
          break;
        }
        const docs = YAML.parseAllDocuments(content).map((d) => d.toJSON());
        for (const doc of docs) {
          if (!doc?.kind || !doc?.metadata?.name) continue;
          state = deleteResource(state, doc.kind, doc.metadata.namespace || namespace, doc.metadata.name);
          out.push(`${doc.kind.toLowerCase()}.apps "${doc.metadata.name}" deleted`);
        }
        break;
      }
      const kindWord = tokens[1];
      const name = tokens[2];
      const ns = nsOf(tokens, namespace);
      const kind = kindMap[kindWord];
      if (!kind || !name) {
        out.push('error: usage: kubectl delete <resource> <name>');
        break;
      }
      state = kind === 'Pod' ? deletePod(state, ns, name) : deleteResource(state, kind, ns, name);
      out.push(`${kindWord} "${name}" deleted`);
      break;
    }
    case 'scale': {
      const target = tokens[1] || '';
      const [, name] = target.split('/');
      const replicas = flag(tokens, '--replicas');
      const ns = nsOf(tokens, namespace);
      if (!name || replicas == null) {
        out.push('error: usage: kubectl scale deployment/<name> --replicas=N');
        break;
      }
      state = scaleDeployment(state, ns, name, parseInt(replicas, 10));
      out.push(`deployment.apps/${name} scaled`);
      break;
    }
    case 'rollout': {
      const sub = tokens[1];
      const target = tokens[2] || '';
      const [, name] = target.split('/');
      const ns = nsOf(tokens, namespace);
      if (!name) {
        out.push('error: usage: kubectl rollout status|undo|restart deployment/<name>');
        break;
      }
      if (sub === 'status') {
        const dep = state.deployments[resourceKey('Deployment', ns, name)];
        if (!dep) out.push(`error: deployment "${name}" not found`);
        else {
          const desired = templateHash(dep.template);
          const rs = Object.values(state.replicaSets).find((r) => r.podHash === desired && r.meta.ownerRef?.name === name);
          const ready = rs ? podsForOwner(state, 'ReplicaSet', ns, rs.meta.name).filter((p) => p.ready).length : 0;
          out.push(
            ready >= dep.replicas
              ? `deployment "${name}" successfully rolled out`
              : `Waiting for deployment "${name}" rollout to finish: ${ready} of ${dep.replicas} updated replicas are available...`
          );
        }
      } else if (sub === 'undo') {
        const res = rolloutUndo(state, ns, name);
        state = res.state;
        out.push(res.message);
      } else if (sub === 'restart') {
        state = rolloutRestart(state, ns, name);
        out.push(`deployment.apps/${name} restarted`);
      } else {
        out.push('error: usage: kubectl rollout status|undo|restart deployment/<name>');
      }
      break;
    }
    case 'set': {
      if (tokens[1] === 'image') {
        const target = tokens[2] || '';
        const [, name] = target.split('/');
        const pair = tokens[3] || '';
        const [container, image] = pair.split('=');
        const ns = nsOf(tokens, namespace);
        if (!name || !container || !image) {
          out.push('error: usage: kubectl set image deployment/<name> <container>=<image>');
          break;
        }
        state = setImage(state, ns, name, container, image);
        out.push(`deployment.apps/${name} image updated`);
      } else {
        out.push(`error: unsupported set subcommand "${tokens[1]}"`);
      }
      break;
    }
    case 'expose': {
      const target = tokens[1] || '';
      const [, name] = target.split('/');
      const ns = nsOf(tokens, namespace);
      const port = parseInt(flag(tokens, '--port') || '80', 10);
      const targetPort = parseInt(flag(tokens, '--target-port') || String(port), 10);
      const svcName = flag(tokens, '--name') || name;
      const dep = state.deployments[resourceKey('Deployment', ns, name)];
      if (!dep) {
        out.push(`error: deployments.apps "${name}" not found`);
        break;
      }
      const doc = {
        kind: 'Service',
        metadata: { name: svcName, namespace: ns },
        spec: { selector: dep.selector, ports: [{ port, targetPort }] },
      };
      const result = applyManifestDocs(state, [doc]);
      state = result.state;
      out.push(`service/${svcName} exposed`);
      break;
    }
    case 'explain': {
      const key = (tokens[1] || '').split('.')[0].toLowerCase();
      out.push(EXPLAIN[key] || `No built-in explanation for "${tokens[1]}". Try: pod, deployment, replicaset, service, configmap, secret, job, cronjob, ingress, namespace, node`);
      break;
    }
    case 'exec':
    case 'port-forward':
    case 'top':
      out.push(`(${cmd} isn't simulated in this sandbox — it doesn't change cluster state, so it's out of scope here. Try "kubectl get" or "kubectl describe" instead.)`);
      break;
    default:
      out.push(`error: unknown command "${cmd}". Type "help" for a list of supported commands.`);
  }

  return { state, files, namespace, output: out };
}

function renderPods(state: ClusterState, ns: string | undefined, allNs: boolean, nameArg?: string): string[] {
  const pods = Object.values(state.pods).filter((p) => (allNs || p.meta.namespace === ns) && (!nameArg || p.meta.name === nameArg));
  if (pods.length === 0) return ['No resources found' + (ns ? ` in ${ns} namespace.` : '.')];
  const headers = allNs ? ['NAMESPACE', 'NAME', 'READY', 'STATUS', 'RESTARTS', 'AGE'] : ['NAME', 'READY', 'STATUS', 'RESTARTS', 'AGE'];
  const rows = pods.map((p) => (allNs ? [p.meta.namespace, ...podStatusLine(state, p)] : podStatusLine(state, p)));
  return table(headers, rows);
}

function renderDeployments(state: ClusterState, ns: string | undefined, allNs: boolean, nameArg?: string): string[] {
  const deps = Object.values(state.deployments).filter((d) => (allNs || d.meta.namespace === ns) && (!nameArg || d.meta.name === nameArg));
  if (deps.length === 0) return ['No resources found' + (ns ? ` in ${ns} namespace.` : '.')];
  const headers = allNs ? ['NAMESPACE', 'NAME', 'READY', 'UP-TO-DATE', 'AVAILABLE', 'AGE'] : ['NAME', 'READY', 'UP-TO-DATE', 'AVAILABLE', 'AGE'];
  const rows = deps.map((d) => {
    const hash = templateHash(d.template);
    const rs = Object.values(state.replicaSets).find((r) => r.podHash === hash && r.meta.ownerRef?.name === d.meta.name);
    const pods = rs ? podsForOwner(state, 'ReplicaSet', d.meta.namespace, rs.meta.name) : [];
    const ready = pods.filter((p) => p.ready).length;
    const row = [d.meta.name, `${ready}/${d.replicas}`, String(rs?.replicas ?? 0), String(ready), age(state, d.meta.creationTick)];
    return allNs ? [d.meta.namespace, ...row] : row;
  });
  return table(headers, rows);
}

function renderServices(state: ClusterState, ns: string | undefined, allNs: boolean, nameArg?: string): string[] {
  const svcs = Object.values(state.services).filter((s) => (allNs || s.meta.namespace === ns) && (!nameArg || s.meta.name === nameArg));
  if (svcs.length === 0) return ['No resources found' + (ns ? ` in ${ns} namespace.` : '.')];
  const headers = allNs ? ['NAMESPACE', 'NAME', 'TYPE', 'CLUSTER-IP', 'PORT(S)', 'AGE'] : ['NAME', 'TYPE', 'CLUSTER-IP', 'PORT(S)', 'AGE'];
  const rows = svcs.map((s) => {
    const ports = s.ports.map((p) => `${p.port}:${p.targetPort}/${p.protocol || 'TCP'}`).join(',');
    const row = [s.meta.name, s.type, s.clusterIP, ports, age(state, s.meta.creationTick)];
    return allNs ? [s.meta.namespace, ...row] : row;
  });
  return table(headers, rows);
}

function describeResource(state: ClusterState, kind: string, ns: string, name: string): string[] {
  const key = resourceKey(kind, ns, name);
  const out: string[] = [];
  if (kind === 'Pod') {
    const p = state.pods[key];
    if (!p) return [`Error from server (NotFound): pods "${name}" not found`];
    out.push(`Name:         ${p.meta.name}`, `Namespace:    ${p.meta.namespace}`, `Node:         ${p.nodeName || '<none>'}`, `Status:       ${p.phase}`, `Ready:        ${p.ready}`, `Restarts:     ${p.restartCount}`);
    if (p.meta.ownerRef) out.push(`Controlled By: ${p.meta.ownerRef.kind}/${p.meta.ownerRef.name}`);
    out.push('Labels:');
    Object.entries(p.meta.labels).forEach(([k, v]) => out.push(`  ${k}=${v}`));
    out.push('Containers:');
    p.containers.forEach((c) => out.push(`  ${c.name}:`, `    Image: ${c.image}`, `    Requests: cpu=${c.cpu}m memory=${c.memory}Mi`));
    if (p.pendingReason) out.push(`Reason: ${p.pendingReason}`);
    out.push('Events:');
    const evs = state.events.filter((e) => e.involvedObject === key).slice(-10);
    if (!evs.length) out.push('  <none>');
    evs.forEach((e) => out.push(`  ${e.type}\t${e.reason}\t${e.message}`));
  } else if (kind === 'Deployment') {
    const d = state.deployments[key];
    if (!d) return [`Error from server (NotFound): deployments.apps "${name}" not found`];
    const hash = templateHash(d.template);
    const rs = Object.values(state.replicaSets).find((r) => r.podHash === hash && r.meta.ownerRef?.name === d.meta.name);
    const pods = rs ? podsForOwner(state, 'ReplicaSet', ns, rs.meta.name) : [];
    out.push(
      `Name:              ${d.meta.name}`,
      `Namespace:         ${d.meta.namespace}`,
      `Replicas:          ${d.replicas} desired | ${pods.length} current | ${pods.filter((p) => p.ready).length} ready`,
      `StrategyType:      ${d.strategy}`,
      `Revision:          ${d.revision}`,
      `Selector:          ${Object.entries(d.selector).map(([k, v]) => `${k}=${v}`).join(',')}`,
      'Pod Template:'
    );
    d.template.containers.forEach((c) => out.push(`  ${c.name}: image=${c.image} cpu=${c.cpu}m memory=${c.memory}Mi`));
    out.push('OldReplicaSets:', ...Object.values(state.replicaSets).filter((r) => r.meta.ownerRef?.name === d.meta.name && r.podHash !== hash).map((r) => `  ${r.meta.name} (${r.replicas} replicas)`));
    out.push(`NewReplicaSet:     ${rs?.meta.name ?? '<none>'} (${rs?.replicas ?? 0} replicas)`);
  } else if (kind === 'Service') {
    const s = state.services[key];
    if (!s) return [`Error from server (NotFound): services "${name}" not found`];
    const endpoints = getEndpoints(state, s);
    out.push(
      `Name:              ${s.meta.name}`,
      `Namespace:         ${s.meta.namespace}`,
      `Type:              ${s.type}`,
      `IP:                ${s.clusterIP}`,
      `Selector:          ${Object.entries(s.selector).map(([k, v]) => `${k}=${v}`).join(',') || '<none>'}`,
      `Port(s):           ${s.ports.map((p) => `${p.port}/${p.protocol || 'TCP'}`).join(', ')}`,
      `Endpoints:         ${endpoints.length ? endpoints.map((p) => `${p.meta.name}:${s.ports[0]?.targetPort}`).join(', ') : '<none> (no Ready pods match the selector)'}`
    );
  } else {
    out.push(`(describe not implemented for ${kind} in this sandbox — try "kubectl get ${kind.toLowerCase()} ${name} -o yaml"-style inspection isn't supported either; use the Cluster panel.)`);
  }
  return out;
}
