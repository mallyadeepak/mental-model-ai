import OpenAI from 'openai';
import type { ProviderResponse } from '../types.js';
import { BaseAIProvider } from './base.js';

export class OpenAIProvider extends BaseAIProvider {
  name = 'openai';
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o') {
    super();
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateCompletion(prompt: string, systemPrompt?: string): Promise<ProviderResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 4096,
      messages: [
        {
          role: 'system',
          content: systemPrompt || 'You are an expert at explaining complex concepts through clear mental models and analogies.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const choice = response.choices[0];

    return {
      content: choice?.message?.content || '',
      usage: response.usage ? {
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens,
      } : undefined,
    };
  }
}
