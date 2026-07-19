export interface DiagramNode {
  id: string;
  label: string;
  sublabel?: string;
  depth: number; // column position, 0 = leftmost
  kind: 'control' | 'workload' | 'network' | 'storage' | 'external' | 'concept';
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Challenge {
  instructions: string;
  hints: string[];
  /** Returns a message describing what's still missing, or null when solved. */
  check: (ctx: import('../engine/types').ClusterState) => string | null;
  successMessage: string;
}

export interface Lesson {
  id: string;
  title: string;
  icon: string;
  tagline: string;
  category: string;
  explanation: string; // markdown
  keyTerms: { term: string; definition: string }[];
  diagram: { nodes: DiagramNode[]; edges: DiagramEdge[] };
  yamlFilename: string;
  yaml: string;
  yamlNotes: { match: string; note: string }[];
  challenge: Challenge;
  quiz: QuizQuestion[];
}
