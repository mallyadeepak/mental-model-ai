import { z } from 'zod';
import type { MentalModelGenerator } from '@mental-model/core';
import { formatModelAsText } from './explain-concept.js';

export const explainRelationshipSchema = z.object({
  components: z
    .array(z.string())
    .min(2)
    .describe('List of components/files/modules to analyze'),
  codeSnippets: z
    .array(
      z.object({
        name: z.string(),
        code: z.string(),
      })
    )
    .optional()
    .describe('Optional code snippets for each component'),
  question: z.string().optional().describe('Specific question about the relationship'),
});

export type ExplainRelationshipInput = z.infer<typeof explainRelationshipSchema>;

export async function explainRelationship(
  generator: MentalModelGenerator,
  input: ExplainRelationshipInput
): Promise<string> {
  const componentList = input.components.join(', ');

  let codeContext = '';
  if (input.codeSnippets && input.codeSnippets.length > 0) {
    codeContext = '\n\nRelevant code:\n';
    for (const snippet of input.codeSnippets) {
      codeContext += `\n### ${snippet.name}\n\`\`\`\n${snippet.code}\n\`\`\`\n`;
    }
  }

  const specificQuestion = input.question
    ? `\n\nSpecifically address: ${input.question}`
    : '';

  const prompt = `Create a mental model showing how these components relate to each other: ${componentList}
${codeContext}
${specificQuestion}

Explain:
1. How each component interacts with the others
2. Data or control flow between them
3. Dependencies and coupling
4. Interfaces or contracts between components
5. Any patterns (e.g., observer, mediator) in their interaction`;

  const result = await generator.generate({
    query: prompt,
    diagramType: 'conceptmap',
  });

  if (result.success && result.model) {
    return formatModelAsText(result.model);
  }

  return `Error: ${result.error || 'Failed to generate relationship explanation'}`;
}
