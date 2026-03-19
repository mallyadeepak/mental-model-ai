import { z } from 'zod';
import type { MentalModelGenerator } from '@mental-model/core';
import { formatModelAsText } from './explain-concept.js';

export const explainCodeSchema = z.object({
  code: z.string().describe('The code snippet to explain'),
  language: z.string().optional().describe('Programming language of the code'),
  focus: z
    .enum(['architecture', 'logic', 'data-flow', 'all'])
    .default('all')
    .describe('What aspect of the code to focus on'),
});

export type ExplainCodeInput = z.infer<typeof explainCodeSchema>;

export async function explainCode(
  generator: MentalModelGenerator,
  input: ExplainCodeInput
): Promise<string> {
  const languageHint = input.language ? ` (${input.language})` : '';
  const focusInstructions = {
    architecture:
      'Focus on the architectural patterns, components, and how they interact.',
    logic: 'Focus on the control flow, algorithms, and decision points.',
    'data-flow': 'Focus on how data moves through the code, transformations, and state changes.',
    all: 'Provide a comprehensive explanation covering architecture, logic, and data flow.',
  }[input.focus];

  const prompt = `Explain this code${languageHint} as a mental model:

\`\`\`${input.language || ''}
${input.code}
\`\`\`

${focusInstructions}

Create a visual mental model that helps understand:
1. The key components/functions and their responsibilities
2. How they relate to each other
3. The flow of execution or data
4. Any patterns or abstractions being used`;

  const result = await generator.generate({
    query: prompt,
    diagramType: input.focus === 'data-flow' ? 'flowchart' : 'conceptmap',
  });

  if (result.success && result.model) {
    return formatModelAsText(result.model);
  }

  return `Error: ${result.error || 'Failed to generate code explanation'}`;
}
