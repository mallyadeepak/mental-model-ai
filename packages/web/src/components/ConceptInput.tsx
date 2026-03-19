import { useState, FormEvent } from 'react';
import type { DiagramType } from '@mental-model/core';

interface ConceptInputProps {
  onGenerate: (query: string, diagramType: DiagramType) => void;
  loading: boolean;
  disabled: boolean;
}

const diagramTypes: { value: DiagramType; label: string; icon: string }[] = [
  { value: 'mindmap', label: 'Mind Map', icon: '🗺️' },
  { value: 'flowchart', label: 'Flowchart', icon: '📊' },
  { value: 'conceptmap', label: 'Concept Map', icon: '🔗' },
];

const exampleQueries = [
  'How does async/await work in JavaScript?',
  'Explain dependency injection',
  'What is the event loop?',
  'How does Git branching work?',
];

export function ConceptInput({ onGenerate, loading, disabled }: ConceptInputProps) {
  const [query, setQuery] = useState('');
  const [diagramType, setDiagramType] = useState<DiagramType>('mindmap');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      onGenerate(query.trim(), diagramType);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a concept or question to visualize..."
            disabled={loading || disabled}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <select
            value={diagramType}
            onChange={(e) => setDiagramType(e.target.value as DiagramType)}
            disabled={loading}
            className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50"
          >
            {diagramTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={loading || !query.trim() || disabled}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium
                     rounded-lg transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <span>Generate</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>

        {/* Example queries */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 dark:text-gray-400">Try:</span>
          {exampleQueries.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => handleExampleClick(example)}
              disabled={loading}
              className="text-sm px-3 py-1 rounded-full
                       bg-gray-100 dark:bg-gray-700
                       text-gray-600 dark:text-gray-300
                       hover:bg-gray-200 dark:hover:bg-gray-600
                       transition-colors disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>

        {disabled && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Please configure your API key in Settings to start generating mental models.
          </p>
        )}
      </form>
    </div>
  );
}
