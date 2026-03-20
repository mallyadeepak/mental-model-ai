/**
 * Tests for the MCP server tool handlers
 * Run with: npx tsx src/index.test.ts
 */

// Simulate the tool handler logic for testing
const MENTAL_MODEL_SCHEMA = `{
  "title": "string", "summary": "string", "diagramType": "mindmap|flowchart|conceptmap",
  "nodes": [{ "id": "string", "label": "string", "description": "string", "depth": 0-3, "nodeType": "concept|process|example|analogy", "parentId": "string|null" }],
  "edges": [{ "id": "string", "source": "node-id", "target": "node-id", "label": "string", "edgeType": "contains|leads_to|depends_on|relates" }],
  "analogies": [{ "concept": "string", "realWorldExample": "string", "explanation": "string", "relatedNodeId": "string" }]
}`;

// Tool handler functions extracted for testing
function handleExplainConcept(args: {
  concept: string;
  diagramType?: string;
  depth?: number;
  context?: string;
}): string {
  const { concept, diagramType = 'mindmap', depth = 2, context } = args;

  return `Create a mental model to explain: "${concept}"
${context ? `Context: ${context}\n` : ''}
Diagram type: ${diagramType}
Depth: ${depth} levels

Please generate a mental model with:
1. **${depth * 3}-${depth * 5} nodes** organized hierarchically (depth 0 = root, higher = more detail)
2. **Edges** connecting related nodes with labeled relationships
3. **2-3 real-world analogies** that make the concept tangible

Output format:
${MENTAL_MODEL_SCHEMA}

Node types: concept (core ideas), process (actions/steps), example (concrete instances), analogy (comparisons)
Edge types: contains, leads_to, depends_on, relates

Make analogies relatable - explain HOW the real-world example maps to the abstract concept.`;
}

function handleExplainCode(args: {
  code: string;
  language?: string;
  focus?: string;
}): string {
  const { code, language, focus = 'all' } = args;

  const focusMap: Record<string, string> = {
    architecture: 'Focus: components & organization',
    logic: 'Focus: control flow & algorithms',
    'data-flow': 'Focus: data movement & transforms',
    all: 'Focus: architecture, logic, data flow',
  };

  return `Mental model for ${language || ''} code:
\`\`\`${language || ''}
${code}
\`\`\`
${focusMap[focus] || ''}
Include: nodes for key functions/classes, edges for interactions, 1+ analogy.
Output: ${MENTAL_MODEL_SCHEMA}`;
}

function handleExplainFile(args: {
  filePath: string;
  fileContent: string;
  projectContext?: string;
}): string {
  const { filePath, fileContent, projectContext } = args;

  return `Mental model for file: ${filePath}
${projectContext ? `Project: ${projectContext}\n` : ''}\`\`\`
${fileContent}
\`\`\`
Include: main purpose (root), key exports/functions, dependencies, 1 analogy.
Output: ${MENTAL_MODEL_SCHEMA}`;
}

function handleExplainRelationship(args: {
  components: string[];
  codeSnippets?: Array<{ name: string; code: string }>;
  question?: string;
}): string {
  const { components, codeSnippets, question } = args;

  const codeContext = codeSnippets?.length
    ? '\nCode:\n' + codeSnippets.map((s) => `${s.name}:\n\`\`\`\n${s.code}\n\`\`\``).join('\n')
    : '';

  return `Mental model for component relationships: ${components.join(', ')}${codeContext}${question ? `\nQ: ${question}` : ''}
Include: node per component, edges for interactions/dependencies, 1 analogy.
Output: ${MENTAL_MODEL_SCHEMA}`;
}

// Test utilities
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.log(`✗ ${message}`);
    failed++;
  }
}

function assertContains(str: string, substring: string, message: string) {
  assert(str.includes(substring), message);
}

function assertNotContains(str: string, substring: string, message: string) {
  assert(!str.includes(substring), message);
}

// Tests
console.log('\n=== Testing MCP Server Tool Handlers ===\n');

// Test 1: explain_concept
console.log('--- explain_concept tests ---');
{
  const result = handleExplainConcept({ concept: 'recursion' });
  assertContains(result, '"recursion"', 'Should include concept name');
  assertContains(result, 'mindmap', 'Should default to mindmap');
  assertContains(result, '6-10 nodes', 'Should calculate nodes based on depth 2');
  assertContains(result, MENTAL_MODEL_SCHEMA, 'Should include JSON schema');
  assertNotContains(result, 'Context:', 'Should not include context when not provided');
}

{
  const result = handleExplainConcept({
    concept: 'API design',
    diagramType: 'flowchart',
    depth: 3,
    context: 'REST APIs',
  });
  assertContains(result, 'flowchart', 'Should use specified diagram type');
  assertContains(result, '9-15 nodes', 'Should calculate nodes for depth 3');
  assertContains(result, 'Context: REST APIs', 'Should include context when provided');
}

// Test 2: explain_code
console.log('\n--- explain_code tests ---');
{
  const code = 'function add(a, b) { return a + b; }';
  const result = handleExplainCode({ code, language: 'javascript' });
  assertContains(result, 'javascript', 'Should include language');
  assertContains(result, code, 'Should include the code');
  assertContains(result, 'Focus: architecture, logic, data flow', 'Should default to all focus');
}

{
  const result = handleExplainCode({
    code: 'def foo(): pass',
    language: 'python',
    focus: 'logic',
  });
  assertContains(result, 'Focus: control flow & algorithms', 'Should use logic focus');
}

{
  const result = handleExplainCode({
    code: 'class Foo {}',
    focus: 'architecture',
  });
  assertContains(result, 'Focus: components & organization', 'Should use architecture focus');
}

// Test 3: explain_file
console.log('\n--- explain_file tests ---');
{
  const result = handleExplainFile({
    filePath: '/src/utils.ts',
    fileContent: 'export const helper = () => {};',
  });
  assertContains(result, '/src/utils.ts', 'Should include file path');
  assertContains(result, 'export const helper', 'Should include file content');
  assertNotContains(result, 'Project:', 'Should not include project context when not provided');
}

{
  const result = handleExplainFile({
    filePath: '/src/api.ts',
    fileContent: 'export class API {}',
    projectContext: 'A REST API server',
  });
  assertContains(result, 'Project: A REST API server', 'Should include project context');
}

// Test 4: explain_relationship
console.log('\n--- explain_relationship tests ---');
{
  const result = handleExplainRelationship({
    components: ['UserService', 'AuthService'],
  });
  assertContains(result, 'UserService, AuthService', 'Should include component names');
  assertNotContains(result, 'Code:', 'Should not include code section when not provided');
  assertNotContains(result, 'Q:', 'Should not include question when not provided');
}

{
  const result = handleExplainRelationship({
    components: ['A', 'B'],
    codeSnippets: [{ name: 'A', code: 'class A {}' }],
    question: 'How do they communicate?',
  });
  assertContains(result, 'Code:', 'Should include code section');
  assertContains(result, 'A:\n```\nclass A {}', 'Should format code snippets');
  assertContains(result, 'Q: How do they communicate?', 'Should include question');
}

// Test 5: Schema compactness
console.log('\n--- Schema compactness tests ---');
{
  const schemaLines = MENTAL_MODEL_SCHEMA.split('\n').length;
  assert(schemaLines <= 6, `Schema should be compact (${schemaLines} lines, expected <=6)`);

  assertContains(MENTAL_MODEL_SCHEMA, 'nodes', 'Schema should have nodes');
  assertContains(MENTAL_MODEL_SCHEMA, 'edges', 'Schema should have edges');
  assertContains(MENTAL_MODEL_SCHEMA, 'analogies', 'Schema should have analogies');
  assertContains(MENTAL_MODEL_SCHEMA, 'nodeType', 'Schema should define node types');
  assertContains(MENTAL_MODEL_SCHEMA, 'edgeType', 'Schema should define edge types');
}

// Test 6: Token efficiency checks (schema is 6 lines, so thresholds account for that)
console.log('\n--- Token efficiency tests ---');
{
  const conceptPrompt = handleExplainConcept({ concept: 'test' });
  const lines = conceptPrompt.split('\n').length;
  // explain_concept is the most detailed, allowing up to 25 lines
  assert(lines <= 25, `explain_concept prompt should be concise (${lines} lines, expected <=25)`);
}

{
  const codePrompt = handleExplainCode({ code: 'x', language: 'js' });
  const lines = codePrompt.split('\n').length;
  assert(lines <= 15, `explain_code prompt should be concise (${lines} lines, expected <=15)`);
}

{
  const filePrompt = handleExplainFile({ filePath: 'f', fileContent: 'c' });
  const lines = filePrompt.split('\n').length;
  assert(lines <= 15, `explain_file prompt should be concise (${lines} lines, expected <=15)`);
}

{
  const relPrompt = handleExplainRelationship({ components: ['a', 'b'] });
  const lines = relPrompt.split('\n').length;
  assert(lines <= 12, `explain_relationship prompt should be concise (${lines} lines, expected <=12)`);
}

// Test 7: Markdown formatting
console.log('\n--- commit_mental_model markdown tests ---');

interface MentalModelNode {
  id: string;
  label: string;
  description: string;
  depth: number;
  nodeType: string;
  parentId?: string | null;
}

interface MentalModelEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  edgeType: string;
}

interface MentalModelAnalogy {
  concept: string;
  realWorldExample: string;
  explanation: string;
  relatedNodeId?: string;
}

interface MentalModel {
  title: string;
  summary: string;
  diagramType: string;
  nodes: MentalModelNode[];
  edges: MentalModelEdge[];
  analogies: MentalModelAnalogy[];
}

function formatMentalModelAsMarkdown(model: MentalModel): string {
  const lines: string[] = [];

  lines.push(`# ${model.title}`);
  lines.push('');
  lines.push(`> ${model.summary}`);
  lines.push('');
  lines.push(`**Diagram Type:** ${model.diagramType}`);
  lines.push('');

  const nodeMap = new Map(model.nodes.map((n) => [n.id, n]));
  const rootNodes = model.nodes.filter((n) => !n.parentId || n.parentId === null);
  const childrenMap = new Map<string, MentalModelNode[]>();

  for (const node of model.nodes) {
    if (node.parentId) {
      const children = childrenMap.get(node.parentId) || [];
      children.push(node);
      childrenMap.set(node.parentId, children);
    }
  }

  lines.push('## Concepts');
  lines.push('');

  function renderNode(node: MentalModelNode, indent: string = ''): void {
    const typeEmoji: Record<string, string> = {
      concept: '💡',
      process: '⚙️',
      example: '📝',
      analogy: '🔄',
    };
    const emoji = typeEmoji[node.nodeType] || '•';

    lines.push(`${indent}- ${emoji} **${node.label}**`);
    if (node.description) {
      lines.push(`${indent}  ${node.description}`);
    }

    const children = childrenMap.get(node.id) || [];
    for (const child of children) {
      renderNode(child, indent + '  ');
    }
  }

  for (const root of rootNodes) {
    renderNode(root);
    lines.push('');
  }

  if (model.edges.length > 0) {
    lines.push('## Relationships');
    lines.push('');
    for (const edge of model.edges) {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (source && target) {
        lines.push(`- **${source.label}** → *${edge.label}* → **${target.label}**`);
      }
    }
    lines.push('');
  }

  if (model.analogies.length > 0) {
    lines.push('## Real-World Analogies');
    lines.push('');
    for (const analogy of model.analogies) {
      lines.push(`### ${analogy.concept} ↔ ${analogy.realWorldExample}`);
      lines.push('');
      lines.push(analogy.explanation);
      lines.push('');
    }
  }

  lines.push('---');
  lines.push(`*Generated on ${new Date().toISOString().split('T')[0]}*`);

  return lines.join('\n');
}

{
  const testModel: MentalModel = {
    title: 'Test Mental Model',
    summary: 'A test summary',
    diagramType: 'mindmap',
    nodes: [
      { id: 'n1', label: 'Root Node', description: 'The root', depth: 0, nodeType: 'concept', parentId: null },
      { id: 'n2', label: 'Child Node', description: 'A child', depth: 1, nodeType: 'process', parentId: 'n1' },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', label: 'contains', edgeType: 'contains' },
    ],
    analogies: [
      { concept: 'Tree', realWorldExample: 'Family tree', explanation: 'Like a family tree' },
    ],
  };

  const markdown = formatMentalModelAsMarkdown(testModel);

  assertContains(markdown, '# Test Mental Model', 'Should have title as heading');
  assertContains(markdown, '> A test summary', 'Should have summary as blockquote');
  assertContains(markdown, '**Diagram Type:** mindmap', 'Should include diagram type');
  assertContains(markdown, '## Concepts', 'Should have Concepts section');
  assertContains(markdown, '💡 **Root Node**', 'Should render concept nodes with emoji');
  assertContains(markdown, '⚙️ **Child Node**', 'Should render process nodes with emoji');
  assertContains(markdown, '## Relationships', 'Should have Relationships section');
  assertContains(markdown, '**Root Node** → *contains* → **Child Node**', 'Should format edges');
  assertContains(markdown, '## Real-World Analogies', 'Should have Analogies section');
  assertContains(markdown, '### Tree ↔ Family tree', 'Should format analogies');
  assertContains(markdown, '---', 'Should have footer separator');
}

{
  const emptyModel: MentalModel = {
    title: 'Empty Model',
    summary: 'No content',
    diagramType: 'flowchart',
    nodes: [],
    edges: [],
    analogies: [],
  };

  const markdown = formatMentalModelAsMarkdown(emptyModel);

  assertContains(markdown, '# Empty Model', 'Should handle empty model');
  assertNotContains(markdown, '## Relationships', 'Should not have Relationships section when empty');
  assertNotContains(markdown, '## Real-World Analogies', 'Should not have Analogies section when empty');
}

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
