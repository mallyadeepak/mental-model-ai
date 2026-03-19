import { useState, useCallback } from 'react';
import type {
  MentalModel,
  DiagramType,
  AIProviderType,
} from '@mental-model/core';

interface UseMentalModelOptions {
  provider: AIProviderType;
  apiKey: string;
}

interface UseMentalModelReturn {
  model: MentalModel | null;
  loading: boolean;
  error: string | null;
  generate: (query: string, diagramType?: DiagramType, context?: string) => Promise<void>;
  expandNode: (nodeId: string) => Promise<void>;
  clearModel: () => void;
}

// Demo mental model for testing the UI
function createDemoModel(query: string, diagramType: DiagramType): MentalModel {
  const id = `model-${Date.now()}`;
  return {
    id,
    title: `Understanding: ${query}`,
    summary: `A mental model explaining ${query} through visual concepts and real-world analogies.`,
    diagramType,
    nodes: [
      {
        id: 'node-1',
        label: query,
        description: `The core concept of ${query} - click to explore deeper.`,
        depth: 0,
        expandable: true,
        nodeType: 'concept',
      },
      {
        id: 'node-2',
        label: 'Key Component A',
        description: 'An essential part that makes up the whole system.',
        depth: 1,
        expandable: true,
        nodeType: 'concept',
        parentId: 'node-1',
      },
      {
        id: 'node-3',
        label: 'Key Component B',
        description: 'Another fundamental aspect to understand.',
        depth: 1,
        expandable: true,
        nodeType: 'process',
        parentId: 'node-1',
      },
      {
        id: 'node-4',
        label: 'How It Works',
        description: 'The process that ties everything together.',
        depth: 1,
        expandable: false,
        nodeType: 'process',
        parentId: 'node-1',
      },
      {
        id: 'node-5',
        label: 'Real Example',
        description: 'A concrete instance showing this in action.',
        depth: 2,
        expandable: false,
        nodeType: 'example',
        parentId: 'node-2',
      },
      {
        id: 'node-6',
        label: 'Like a Factory',
        description: 'Think of it like a factory assembly line.',
        depth: 2,
        expandable: false,
        nodeType: 'analogy',
        parentId: 'node-3',
      },
    ],
    edges: [
      { id: 'edge-1', source: 'node-1', target: 'node-2', label: 'contains', edgeType: 'contains' },
      { id: 'edge-2', source: 'node-1', target: 'node-3', label: 'contains', edgeType: 'contains' },
      { id: 'edge-3', source: 'node-1', target: 'node-4', label: 'leads to', edgeType: 'leads_to' },
      { id: 'edge-4', source: 'node-2', target: 'node-5', label: 'example', edgeType: 'contains' },
      { id: 'edge-5', source: 'node-3', target: 'node-6', label: 'analogy', edgeType: 'relates' },
      { id: 'edge-6', source: 'node-2', target: 'node-3', label: 'depends on', edgeType: 'depends_on' },
    ],
    analogies: [
      {
        concept: query,
        realWorldExample: 'A Factory Assembly Line',
        explanation: `Just like a factory has different stations that each perform a specific task, ${query} works by breaking down complex operations into manageable steps that flow from one to the next.`,
        relatedNodeId: 'node-1',
      },
      {
        concept: 'Key Component A',
        realWorldExample: 'Building Blocks',
        explanation: 'Like LEGO blocks that snap together to create larger structures, this component provides the foundational pieces that combine to form the complete system.',
        relatedNodeId: 'node-2',
      },
      {
        concept: 'Key Component B',
        realWorldExample: 'A Traffic Controller',
        explanation: 'Similar to how a traffic controller manages the flow of vehicles at an intersection, this process coordinates and directs the flow of information.',
        relatedNodeId: 'node-3',
      },
    ],
  };
}

// Calculate positions for nodes
function calculatePositions(model: MentalModel): MentalModel {
  const nodesByDepth = new Map<number, typeof model.nodes>();

  for (const node of model.nodes) {
    const depth = node.depth;
    if (!nodesByDepth.has(depth)) {
      nodesByDepth.set(depth, []);
    }
    nodesByDepth.get(depth)!.push(node);
  }

  const horizontalSpacing = 250;
  const verticalSpacing = 150;

  for (const [depth, nodes] of nodesByDepth) {
    const levelWidth = nodes.length * horizontalSpacing;
    const startX = -levelWidth / 2 + horizontalSpacing / 2;

    nodes.forEach((node, index) => {
      node.position = {
        x: startX + index * horizontalSpacing,
        y: depth * verticalSpacing,
      };
    });
  }

  return model;
}

export function useMentalModel({ provider, apiKey }: UseMentalModelOptions): UseMentalModelReturn {
  const [model, setModel] = useState<MentalModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (query: string, diagramType: DiagramType = 'mindmap') => {
      if (!apiKey) {
        setError('Please configure your API key first');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // For demo purposes, create a mock model
        // In production, this would call a backend API that uses the AI SDK
        const demoModel = createDemoModel(query, diagramType);
        const modelWithPositions = calculatePositions(demoModel);

        setModel(modelWithPositions);

        // Show info message that this is demo mode
        console.info(
          'Demo mode: Using mock data. In production, configure a backend API to use the Anthropic/OpenAI SDKs.'
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    },
    [apiKey]
  );

  const expandNode = useCallback(
    async (nodeId: string) => {
      if (!model) {
        setError('No model to expand');
        return;
      }

      const node = model.nodes.find((n) => n.id === nodeId);
      if (!node?.expandable) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Add some child nodes for demo
        const newNodes = [
          {
            id: `${nodeId}-child-1`,
            label: `Detail of ${node.label}`,
            description: 'A deeper look into this concept.',
            depth: node.depth + 1,
            expandable: false,
            nodeType: 'concept' as const,
            parentId: nodeId,
          },
          {
            id: `${nodeId}-child-2`,
            label: `Example`,
            description: 'A practical example demonstrating this.',
            depth: node.depth + 1,
            expandable: false,
            nodeType: 'example' as const,
            parentId: nodeId,
          },
        ];

        const newEdges = newNodes.map((n, i) => ({
          id: `edge-${nodeId}-${i}`,
          source: nodeId,
          target: n.id,
          label: 'contains',
          edgeType: 'contains' as const,
        }));

        const updatedModel: MentalModel = {
          ...model,
          nodes: [
            ...model.nodes.map((n) =>
              n.id === nodeId ? { ...n, expandable: false } : n
            ),
            ...newNodes,
          ],
          edges: [...model.edges, ...newEdges],
        };

        setModel(calculatePositions(updatedModel));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    },
    [model]
  );

  const clearModel = useCallback(() => {
    setModel(null);
    setError(null);
  }, []);

  return {
    model,
    loading,
    error,
    generate,
    expandNode,
    clearModel,
  };
}
