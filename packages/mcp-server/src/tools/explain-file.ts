import { z } from 'zod';
import type { MentalModelGenerator } from '@mental-model/core';
import { formatModelAsText } from './explain-concept.js';

export const explainFileSchema = z.object({
  filePath: z.string().describe('Path to the file to explain'),
  fileContent: z.string().describe('Content of the file'),
  projectContext: z.string().optional().describe('Brief description of the project'),
});

export type ExplainFileInput = z.infer<typeof explainFileSchema>;

export async function explainFile(
  generator: MentalModelGenerator,
  input: ExplainFileInput
): Promise<string> {
  const extension = input.filePath.split('.').pop() || '';
  const languageMap: Record<string, string> = {
    ts: 'TypeScript',
    tsx: 'TypeScript React',
    js: 'JavaScript',
    jsx: 'JavaScript React',
    py: 'Python',
    rs: 'Rust',
    go: 'Go',
    java: 'Java',
    rb: 'Ruby',
    cpp: 'C++',
    c: 'C',
    cs: 'C#',
  };

  const language = languageMap[extension] || extension.toUpperCase();
  const projectContext = input.projectContext
    ? `This file is part of a project: ${input.projectContext}`
    : '';

  const prompt = `Create a mental model for understanding this ${language} file: ${input.filePath}

${projectContext}

File content:
\`\`\`${extension}
${input.fileContent}
\`\`\`

Explain:
1. The purpose and responsibility of this file
2. Key exports, classes, or functions it provides
3. Dependencies and how it fits into the larger codebase
4. Important patterns or conventions used
5. Data structures and their relationships`;

  const result = await generator.generate({
    query: prompt,
    diagramType: 'conceptmap',
  });

  if (result.success && result.model) {
    return formatModelAsText(result.model);
  }

  return `Error: ${result.error || 'Failed to generate file explanation'}`;
}
