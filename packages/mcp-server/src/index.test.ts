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

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
