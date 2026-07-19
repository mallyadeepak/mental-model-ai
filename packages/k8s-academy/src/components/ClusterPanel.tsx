import { useState } from 'react';
import type { UseClusterReturn } from '../hooks/useCluster';
import { ClusterCanvas } from './ClusterCanvas';
import { Terminal } from './Terminal';

export function ClusterPanel({ cluster }: { cluster: UseClusterReturn }) {
  const [view, setView] = useState<'cluster' | 'terminal'>('cluster');
  const namespaces = Array.from(new Set(['default', 'kube-system', ...cluster.state.namespaces]));

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5 text-xs dark:bg-slate-800">
          <button
            onClick={() => setView('cluster')}
            className={`rounded-md px-2.5 py-1 font-semibold transition ${view === 'cluster' ? 'bg-white text-k8s-blue shadow-sm dark:bg-slate-700' : 'text-slate-500'}`}
          >
            🛰️ Cluster
          </button>
          <button
            onClick={() => setView('terminal')}
            className={`rounded-md px-2.5 py-1 font-semibold transition ${view === 'terminal' ? 'bg-white text-k8s-blue shadow-sm dark:bg-slate-700' : 'text-slate-500'}`}
          >
            ⌨️ Terminal
          </button>
        </div>
        <select
          value={cluster.namespace}
          onChange={(e) => cluster.setNamespace(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          {namespaces.map((ns) => (
            <option key={ns} value={ns}>
              ns: {ns}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] dark:border-slate-700 dark:bg-slate-900">
        <button
          onClick={() => cluster.setAutoTick(!cluster.autoTick)}
          className="rounded px-1.5 py-0.5 font-semibold text-k8s-blue hover:bg-blue-50 dark:hover:bg-blue-950/40"
        >
          {cluster.autoTick ? '⏸ Pause' : '▶ Run'}
        </button>
        <button onClick={cluster.step} className="rounded px-1.5 py-0.5 font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
          ⏭ Step
        </button>
        <span className="ml-auto font-mono text-slate-400">tick {cluster.state.clock}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {view === 'cluster' ? (
          <div className="h-full overflow-y-auto">
            <ClusterCanvas state={cluster.state} namespace={cluster.namespace} />
          </div>
        ) : (
          <Terminal lines={cluster.lines} onRun={cluster.runCommand} namespace={cluster.namespace} />
        )}
      </div>
    </div>
  );
}
