import { useCallback, useEffect, useRef, useState } from 'react';
import YAML from 'yaml';
import type { ClusterState } from '../engine/types';
import { applyManifestDocs, createInitialState, reconcile } from '../engine/simulator';
import { executeCommand } from '../engine/kubectl';

export interface TerminalLine {
  id: number;
  kind: 'input' | 'output' | 'error';
  text: string;
}

let lineSeq = 0;

export function useCluster() {
  const [state, setState] = useState<ClusterState>(() => createInitialState());
  const [files, setFiles] = useState<Record<string, string>>({});
  const [namespace, setNamespace] = useState('default');
  const [autoTick, setAutoTick] = useState(true);
  const [speedMs, setSpeedMs] = useState(900);
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: -1, kind: 'output', text: 'Welcome to the K8s Academy sandbox terminal. Type "help" to see supported kubectl commands.' },
  ]);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!autoTick) return;
    const id = setInterval(() => setState((s) => reconcile(s)), speedMs);
    return () => clearInterval(id);
  }, [autoTick, speedMs]);

  const step = useCallback(() => setState((s) => reconcile(s)), []);

  const applyYamlText = useCallback((text: string, filename = 'manifest.yaml') => {
    setFiles((f) => ({ ...f, [filename]: text }));
    let docs: any[];
    try {
      docs = YAML.parseAllDocuments(text).map((d) => {
        if (d.errors.length) throw d.errors[0];
        return d.toJSON();
      });
    } catch (e) {
      return { applied: [], errors: [(e as Error).message] };
    }
    const result = applyManifestDocs(stateRef.current, docs);
    setState(result.state);
    return { applied: result.applied, errors: result.errors };
  }, []);

  const seedFile = useCallback((filename: string, content: string) => {
    setFiles((f) => (f[filename] === content ? f : { ...f, [filename]: content }));
  }, []);

  const runCommand = useCallback(
    (input: string) => {
      setLines((ls) => [...ls, { id: lineSeq++, kind: 'input', text: input }]);
      const result = executeCommand(input, { state: stateRef.current, files, namespace });
      if (result.clear) {
        setLines([]);
        return;
      }
      setState(result.state);
      setFiles(result.files);
      setNamespace(result.namespace);
      setLines((ls) => [
        ...ls,
        ...(result.output.length ? result.output : ['']).map((text) => ({ id: lineSeq++, kind: 'output' as const, text })),
      ]);
    },
    [files, namespace]
  );

  const reset = useCallback(() => {
    setState(createInitialState());
    setFiles({});
    setLines([{ id: lineSeq++, kind: 'output', text: 'Cluster reset. All resources cleared.' }]);
  }, []);

  return {
    state,
    files,
    namespace,
    setNamespace,
    autoTick,
    setAutoTick,
    speedMs,
    setSpeedMs,
    step,
    applyYamlText,
    seedFile,
    lines,
    runCommand,
    reset,
  };
}

export type UseClusterReturn = ReturnType<typeof useCluster>;
