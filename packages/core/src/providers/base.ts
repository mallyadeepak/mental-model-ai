import type { ProviderResponse } from '../types.js';

export interface AIProvider {
  name: string;
  generateCompletion(prompt: string, systemPrompt?: string): Promise<ProviderResponse>;
}

export abstract class BaseAIProvider implements AIProvider {
  abstract name: string;
  abstract generateCompletion(prompt: string, systemPrompt?: string): Promise<ProviderResponse>;
}
