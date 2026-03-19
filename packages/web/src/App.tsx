import { useState, useCallback } from 'react';
import type { DiagramType, AIProviderType } from '@mental-model/core';
import { DiagramView, AnalogyPanel } from '@mental-model/ui';
import { ConceptInput } from './components/ConceptInput';
import { Header } from './components/Header';
import { useMentalModel } from './hooks/useMentalModel';
import { useDarkMode } from './hooks/useDarkMode';
import { SettingsPanel } from './components/SettingsPanel';

export default function App() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [provider, setProvider] = useState<AIProviderType>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const { isDark, toggleTheme } = useDarkMode();

  const {
    model,
    loading,
    error,
    generate,
    expandNode,
    clearModel,
  } = useMentalModel({ provider, apiKey });

  const handleGenerate = useCallback(
    async (query: string, diagramType: DiagramType) => {
      if (!apiKey) {
        setShowSettings(true);
        return;
      }
      await generate(query, diagramType);
    },
    [apiKey, generate]
  );

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  const handleNodeExpand = useCallback(
    async (nodeId: string) => {
      await expandNode(nodeId);
    },
    [expandNode]
  );

  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredNodeId(nodeId);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Header
        onSettingsClick={() => setShowSettings(true)}
        onClear={clearModel}
        hasModel={!!model}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1 flex overflow-hidden">
        {/* Main diagram area */}
        <div className="flex-1 flex flex-col">
          <ConceptInput
            onGenerate={handleGenerate}
            loading={loading}
            disabled={!apiKey}
          />

          <div className="flex-1 relative">
            <DiagramView
              model={model}
              loading={loading}
              error={error}
              onNodeClick={handleNodeClick}
              onNodeExpand={handleNodeExpand}
              onNodeHover={handleNodeHover}
              selectedNodeId={selectedNodeId}
            />
          </div>
        </div>

        {/* Analogy sidebar */}
        {model && model.analogies.length > 0 && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            <AnalogyPanel
              analogies={model.analogies}
              highlightedNodeId={hoveredNodeId || selectedNodeId}
              className="flex-1 rounded-none border-0"
            />
          </div>
        )}
      </main>

      {/* Settings modal */}
      {showSettings && (
        <SettingsPanel
          provider={provider}
          apiKey={apiKey}
          onProviderChange={setProvider}
          onApiKeyChange={setApiKey}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
