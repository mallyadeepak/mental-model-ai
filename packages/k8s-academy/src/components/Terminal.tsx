import { useEffect, useRef, useState } from 'react';
import type { TerminalLine } from '../hooks/useCluster';

export function Terminal({
  lines,
  onRun,
  namespace,
}: {
  lines: TerminalLine[];
  onRun: (cmd: string) => void;
  namespace: string;
}) {
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const submit = () => {
    const cmd = value.trim();
    if (!cmd) return;
    onRun(cmd);
    setHistory((h) => [...h, cmd]);
    setHistoryIdx(null);
    setValue('');
  };

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-950 font-mono text-[12px] text-slate-200 shadow-inner"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center gap-1.5 border-b border-slate-800 bg-slate-900 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        <span className="ml-2 text-[11px] text-slate-400">sandbox — namespace: {namespace}</span>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {lines.map((l) => (
          <div key={l.id} className={l.kind === 'input' ? 'text-emerald-400' : l.kind === 'error' ? 'text-red-400' : 'whitespace-pre text-slate-300'}>
            {l.kind === 'input' ? `$ ${l.text}` : l.text}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-slate-800 px-3 py-2">
        <span className="text-emerald-400">$</span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            else if (e.key === 'ArrowUp') {
              e.preventDefault();
              if (history.length === 0) return;
              const idx = historyIdx === null ? history.length - 1 : Math.max(0, historyIdx - 1);
              setHistoryIdx(idx);
              setValue(history[idx]);
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (historyIdx === null) return;
              const idx = historyIdx + 1;
              if (idx >= history.length) {
                setHistoryIdx(null);
                setValue('');
              } else {
                setHistoryIdx(idx);
                setValue(history[idx]);
              }
            }
          }}
          placeholder="kubectl get pods"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="flex-1 bg-transparent text-slate-100 outline-none placeholder:text-slate-600"
        />
      </div>
    </div>
  );
}
