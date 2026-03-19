import type { MentalModel } from '@mental-model/core';
import { MindMap } from './MindMap.js';
import { FlowChart } from './FlowChart.js';
import { ConceptMap } from './ConceptMap.js';
import type { DiagramProps } from '../types.js';

export interface DiagramViewProps extends Omit<DiagramProps, 'model'> {
  model: MentalModel | null;
  loading?: boolean;
  error?: string | null;
}

export function DiagramView({
  model,
  loading = false,
  error = null,
  ...props
}: DiagramViewProps) {
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4" />
          <p className="text-gray-600">Generating mental model...</p>
          <p className="text-sm text-gray-400 mt-1">
            Creating nodes, edges, and analogies
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50">
        <div className="text-center max-w-md p-6">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Generation Failed
          </h3>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6">
          <div className="text-6xl mb-4">🧠</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Mental Model AI
          </h3>
          <p className="text-gray-600">
            Enter a concept or question above to generate an interactive mental model
            with real-world analogies.
          </p>
        </div>
      </div>
    );
  }

  // Render the appropriate diagram type
  switch (model.diagramType) {
    case 'flowchart':
      return <FlowChart model={model} {...props} />;
    case 'conceptmap':
      return <ConceptMap model={model} {...props} />;
    case 'mindmap':
    default:
      return <MindMap model={model} {...props} />;
  }
}
