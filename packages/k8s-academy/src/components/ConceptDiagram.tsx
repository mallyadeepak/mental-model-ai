import { useMemo, useState } from 'react';
import type { DiagramEdge, DiagramNode } from '../data/types';

const KIND_STYLES: Record<DiagramNode['kind'], string> = {
  control: 'bg-violet-100 border-violet-400 text-violet-900 dark:bg-violet-950 dark:text-violet-200 dark:border-violet-600',
  workload: 'bg-blue-100 border-blue-400 text-blue-900 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-600',
  network: 'bg-emerald-100 border-emerald-400 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-600',
  storage: 'bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-600',
  external: 'bg-slate-100 border-slate-400 text-slate-900 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-500',
  concept: 'bg-rose-100 border-rose-400 text-rose-900 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-600',
};

const NODE_W = 152;
const NODE_H = 56;
const COL_GAP = 96;
const ROW_GAP = 24;
const PAD = 24;

export function ConceptDiagram({ nodes, edges }: { nodes: DiagramNode[]; edges: DiagramEdge[] }) {
  const [hoverId, setHoverId] = useState<string | null>(null);

  const layout = useMemo(() => {
    const byDepth = new Map<number, DiagramNode[]>();
    nodes.forEach((n) => {
      const arr = byDepth.get(n.depth) || [];
      arr.push(n);
      byDepth.set(n.depth, arr);
    });
    const maxRows = Math.max(...[...byDepth.values()].map((a) => a.length), 1);
    const height = maxRows * NODE_H + (maxRows - 1) * ROW_GAP + PAD * 2;
    const positions = new Map<string, { x: number; y: number }>();
    [...byDepth.entries()].forEach(([depth, arr]) => {
      const colHeight = arr.length * NODE_H + (arr.length - 1) * ROW_GAP;
      const startY = (height - colHeight) / 2;
      arr.forEach((n, i) => {
        positions.set(n.id, { x: PAD + depth * (NODE_W + COL_GAP), y: startY + i * (NODE_H + ROW_GAP) });
      });
    });
    const maxDepth = Math.max(...nodes.map((n) => n.depth), 0);
    const width = PAD * 2 + (maxDepth + 1) * NODE_W + maxDepth * COL_GAP;
    return { positions, width, height };
  }, [nodes]);

  const connected = useMemo(() => {
    if (!hoverId) return null;
    const set = new Set<string>([hoverId]);
    edges.forEach((e) => {
      if (e.from === hoverId) set.add(e.to);
      if (e.to === hoverId) set.add(e.from);
    });
    return set;
  }, [hoverId, edges]);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="relative" style={{ width: layout.width, height: layout.height, minWidth: '100%' }}>
        <svg className="absolute inset-0" width={layout.width} height={layout.height}>
          {edges.map((e, i) => {
            const a = layout.positions.get(e.from);
            const b = layout.positions.get(e.to);
            if (!a || !b) return null;
            const x1 = a.x + NODE_W;
            const y1 = a.y + NODE_H / 2;
            const x2 = b.x;
            const y2 = b.y + NODE_H / 2;
            const mx = (x1 + x2) / 2;
            const dim = connected && !(connected.has(e.from) && connected.has(e.to));
            return (
              <g key={i} opacity={dim ? 0.25 : 1}>
                <path
                  d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={dim ? '#94a3b8' : '#326ce3'}
                  strokeWidth={dim ? 1.5 : 2}
                />
                {e.label && (
                  <text x={mx} y={(y1 + y2) / 2 - 6} fontSize={10} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400">
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {nodes.map((n) => {
          const pos = layout.positions.get(n.id)!;
          const dim = connected && !connected.has(n.id);
          return (
            <div
              key={n.id}
              onMouseEnter={() => setHoverId(n.id)}
              onMouseLeave={() => setHoverId(null)}
              className={`absolute flex flex-col items-center justify-center rounded-lg border-2 px-2 text-center shadow-sm transition-all duration-150 ${KIND_STYLES[n.kind]} ${dim ? 'opacity-40' : 'opacity-100'}`}
              style={{ left: pos.x, top: pos.y, width: NODE_W, height: NODE_H }}
            >
              <span className="text-xs font-semibold leading-tight">{n.label}</span>
              {n.sublabel && <span className="text-[10px] opacity-80 leading-tight">{n.sublabel}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
