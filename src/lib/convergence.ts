import { AIResponse, UserApiKeys } from '@/types';
import { callProvider } from './providers';
import { getConvergencePrompt } from './prompts';

/**
 * Check if the AI responses have converged (substantially agree).
 * Uses Gemini first (fastest free tier), then Groq, then Mistral.
 */
export async function checkConvergence(
  question: string,
  responses: AIResponse[],
  userApiKeys?: UserApiKeys
): Promise<boolean> {
  const prompt = getConvergencePrompt(question, responses);

  const judges = ['gemini', 'groq', 'mistral'] as const;

  for (const judge of judges) {
    try {
      const result = await callProvider(judge, prompt, userApiKeys);
      const answer = result.trim().toUpperCase();
      return answer.includes('YES');
    } catch {
      continue;
    }
  }

  // If no judge available, assume converged after we have responses
  return true;
}
