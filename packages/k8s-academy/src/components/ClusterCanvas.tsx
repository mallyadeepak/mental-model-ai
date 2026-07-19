import type { ClusterState, Pod } from '../engine/types';
import { getEndpoints, podsForOwner, templateHash } from '../engine/simulator';

function ControllerPills({ state, namespace }: { state: ClusterState; namespace: string }) {
  const daemonSets = Object.values(state.daemonSets).filter((d) => d.meta.namespace === namespace);
  const statefulSets = Object.values(state.statefulSets).filter((d) => d.meta.namespace === namespace);
  if (daemonSets.length === 0 && statefulSets.length === 0) return null;
  return (
    <section>
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        DaemonSets &amp; StatefulSets
      </h4>
      <div className="flex flex-wrap gap-2">
        {daemonSets.map((d) => {
          const pods = podsForOwner(state, 'DaemonSet', namespace, d.meta.name);
          return (
            <div key={d.meta.uid} className="rounded-full border border-cyan-300 bg-cyan-50 px-3 py-1 text-[11px] font-mono text-cyan-800 dark:border-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
              🛡️ {d.meta.name} · {pods.filter((p) => p.ready).length}/{state.nodes.length} nodes
            </div>
          );
        })}
        {statefulSets.map((d) => {
          const pods = podsForOwner(state, 'StatefulSet', namespace, d.meta.name);
          return (
            <div key={d.meta.uid} className="rounded-full border border-indigo-300 bg-indigo-50 px-3 py-1 text-[11px] font-mono text-indigo-800 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
              🧱 {d.meta.name} · {pods.filter((p) => p.ready).length}/{d.replicas}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PodChip({ pod }: { pod: Pod }) {
  const style: Record<string, string> = {
    Pending: 'border-dashed border-slate-400 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    ContainerCreating: 'border-amber-400 bg-amber-100 text-amber-700 animate-pulse dark:bg-amber-950 dark:text-amber-300',
    Running: pod.ready
      ? 'border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
      : 'border-blue-400 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    CrashLoopBackOff: 'border-red-500 bg-red-100 text-red-700 animate-pulse dark:bg-red-950 dark:text-red-300',
    Completed: 'border-slate-400 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    Failed: 'border-red-500 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    Terminating: 'border-slate-300 bg-slate-50 text-slate-400 opacity-50 dark:bg-slate-900',
  };
  const icon: Record<string, string> = {
    Pending: '⏳',
    ContainerCreating: '📦',
    Running: pod.ready ? '✅' : '🔵',
    CrashLoopBackOff: '💥',
    Completed: '🏁',
    Failed: '❌',
    Terminating: '🫥',
  };
  return (
    <div
      title={`${pod.meta.name}\n${pod.phase}${pod.ready ? ' (Ready)' : ''}\nrestarts: ${pod.restartCount}`}
      className={`animate-pop-in flex items-center gap-1 rounded-md border px-1.5 py-1 text-[10px] font-mono ${style[pod.phase] || ''}`}
    >
      <span>{icon[pod.phase]}</span>
      <span className="max-w-[6rem] truncate">{pod.meta.name}</span>
    </div>
  );
}

export function ClusterCanvas({ state, namespace }: { state: ClusterState; namespace: string }) {
  const pods = Object.values(state.pods).filter((p) => p.meta.namespace === namespace);
  const pending = pods.filter((p) => !p.nodeName);

  return (
    <div className="flex flex-col gap-4 text-sm">
      <section>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Nodes ({state.nodes.length})
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {state.nodes.map((node) => {
            const nodePods = pods.filter((p) => p.nodeName === node.name && p.phase !== 'Terminating');
            const usedCpu = nodePods.reduce((a, p) => a + p.containers.reduce((s, c) => s + c.cpu, 0), 0);
            const usedMem = nodePods.reduce((a, p) => a + p.containers.reduce((s, c) => s + c.memory, 0), 0);
            const cpuPct = Math.min(100, (usedCpu / node.allocatableCpu) * 100);
            return (
              <div key={node.name} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">🖥️ {node.name}</span>
                  <span className="text-[10px] text-slate-400">{usedCpu}m / {node.allocatableCpu}m</span>
                </div>
                <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${cpuPct > 85 ? 'bg-red-500' : cpuPct > 60 ? 'bg-amber-500' : 'bg-k8s-blue'}`}
                    style={{ width: `${cpuPct}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-1 min-h-[2rem]">
                  {nodePods.length === 0 && <span className="text-[10px] italic text-slate-400">empty</span>}
                  {nodePods.map((p) => (
                    <PodChip key={p.meta.uid} pod={p} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {pending.length > 0 && (
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Scheduler queue (unscheduled)
          </h4>
          <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-amber-400 bg-amber-50 p-3 dark:bg-amber-950/30">
            {pending.map((p) => (
              <PodChip key={p.meta.uid} pod={p} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Deployments
        </h4>
        <div className="flex flex-col gap-2">
          {Object.values(state.deployments)
            .filter((d) => d.meta.namespace === namespace)
            .map((d) => {
              const hash = templateHash(d.template);
              const rss = Object.values(state.replicaSets).filter((r) => r.meta.ownerRef?.name === d.meta.name && r.meta.namespace === namespace);
              const newRS = rss.find((r) => r.podHash === hash);
              const readyCount = newRS ? podsForOwner(state, 'ReplicaSet', namespace, newRS.meta.name).filter((p) => p.ready).length : 0;
              return (
                <div key={d.meta.uid} className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">🚀 {d.meta.name}</span>
                    <span className="rounded bg-k8s-blue/10 px-1.5 py-0.5 font-mono text-k8s-blue dark:text-blue-300">
                      {readyCount}/{d.replicas} ready · rev {d.revision}
                    </span>
                  </div>
                  <div className="mt-1.5 flex gap-1">
                    {rss.map((rs) => (
                      <div
                        key={rs.meta.uid}
                        title={`${rs.meta.name}: ${rs.replicas} replicas`}
                        className={`h-2 rounded-full transition-all ${rs.podHash === hash ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                        style={{ width: `${Math.max(rs.replicas, rs.replicas === 0 ? 0 : 1) * 14 + (rs.replicas > 0 ? 6 : 0)}px` }}
                      />
                    ))}
                    {rss.every((r) => r.replicas === 0) && <span className="text-[10px] text-slate-400">no replicas yet</span>}
                  </div>
                </div>
              );
            })}
          {Object.values(state.deployments).filter((d) => d.meta.namespace === namespace).length === 0 && (
            <p className="text-xs italic text-slate-400">No deployments yet in this namespace.</p>
          )}
        </div>
      </section>

      <ControllerPills state={state} namespace={namespace} />

      <section>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Services</h4>
        <div className="flex flex-wrap gap-2">
          {Object.values(state.services)
            .filter((s) => s.meta.namespace === namespace)
            .map((s) => {
              const eps = getEndpoints(state, s);
              return (
                <div
                  key={s.meta.uid}
                  title={`Endpoints: ${eps.map((p) => p.meta.name).join(', ') || 'none'}`}
                  className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[11px] font-mono text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  🔌 {s.meta.name} · {s.clusterIP} · {eps.length} ep
                </div>
              );
            })}
          {Object.values(state.services).filter((s) => s.meta.namespace === namespace).length === 0 && (
            <p className="text-xs italic text-slate-400">No services yet.</p>
          )}
        </div>
      </section>

      {(Object.values(state.jobs).some((j) => j.meta.namespace === namespace) ||
        Object.values(state.cronJobs).some((j) => j.meta.namespace === namespace)) && (
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Jobs &amp; CronJobs</h4>
          <div className="flex flex-wrap gap-2">
            {Object.values(state.jobs)
              .filter((j) => j.meta.namespace === namespace)
              .map((j) => (
                <div key={j.meta.uid} className="rounded-full border border-violet-300 bg-violet-50 px-3 py-1 text-[11px] font-mono text-violet-800 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                  🧮 {j.meta.name} · {j.succeeded}/{j.completions}
                </div>
              ))}
            {Object.values(state.cronJobs)
              .filter((j) => j.meta.namespace === namespace)
              .map((j) => (
                <div key={j.meta.uid} className="rounded-full border border-fuchsia-300 bg-fuchsia-50 px-3 py-1 text-[11px] font-mono text-fuchsia-800 dark:border-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300">
                  ⏰ {j.meta.name} · {j.runCount} runs
                </div>
              ))}
          </div>
        </section>
      )}

      {(Object.values(state.configMaps).some((c) => c.meta.namespace === namespace) ||
        Object.values(state.secrets).some((c) => c.meta.namespace === namespace)) && (
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Config &amp; Secrets</h4>
          <div className="flex flex-wrap gap-2">
            {Object.values(state.configMaps)
              .filter((c) => c.meta.namespace === namespace)
              .map((c) => (
                <div key={c.meta.uid} className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-mono text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  🗂️ {c.meta.name}
                </div>
              ))}
            {Object.values(state.secrets)
              .filter((c) => c.meta.namespace === namespace)
              .map((c) => (
                <div key={c.meta.uid} className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-[11px] font-mono text-rose-800 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                  🔐 {c.meta.name}
                </div>
              ))}
          </div>
        </section>
      )}

      <section>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Events</h4>
        <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-slate-950 p-2 font-mono text-[10px] text-slate-300 dark:border-slate-700">
          {state.events.length === 0 && <p className="italic text-slate-500">No events yet.</p>}
          {state.events
            .slice(-40)
            .reverse()
            .map((e, i) => (
              <div key={i} className={e.type === 'Warning' ? 'text-amber-400' : 'text-slate-300'}>
                [{e.tick}t] {e.reason}: {e.message}
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
