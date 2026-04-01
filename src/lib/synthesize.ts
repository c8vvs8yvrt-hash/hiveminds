import { Round, UserApiKeys } from '@/types';
import { callProvider } from './providers';
import { getSynthesisPrompt } from './prompts';

/**
 * Generate the final consensus answer from all rounds of discussion.
 * Uses Groq first (fast), then Gemini, then Mistral.
 */
export async function synthesizeConsensus(
  question: string,
  rounds: Round[],
  userApiKeys?: UserApiKeys
): Promise<string> {
  const prompt = getSynthesisPrompt(question, rounds);

  const synthesizers = ['groq', 'gemini', 'mistral'] as const;

  for (const synth of synthesizers) {
    try {
      return await callProvider(synth, prompt, userApiKeys);
    } catch {
      continue;
    }
  }

  // Fallback: combine last round's responses
  const lastRound = rounds[rounds.length - 1];
  return lastRound.responses
    .map((r) => r.content)
    .join('\n\n');
}
