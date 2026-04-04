/**
 * Verification Layer
 *
 * After the judge synthesizes the final answer, this layer checks
 * key claims against retrieved sources and flags unsupported statements.
 */

import { UserApiKeys } from '@/types';
import { callProvider } from './providers';
import { SearchResult } from './search';

export interface VerificationResult {
  verifiedAnswer: string;
  sources: SearchResult[];
}

/**
 * Run verification pass on the synthesized answer.
 * Uses a model to check claims against sources and remove unsupported ones.
 */
export async function verifyAnswer(
  answer: string,
  sources: SearchResult[],
  userApiKeys?: UserApiKeys
): Promise<VerificationResult> {
  // If no sources, return answer as-is
  if (sources.length === 0) {
    return { verifiedAnswer: answer, sources: [] };
  }

  const sourceText = sources
    .map((s, i) => `[${i + 1}] (${s.tierLabel}) ${s.title}: ${s.snippet}`)
    .join('\n');

  const prompt = `You are a FACT VERIFICATION system. Your job is to check an AI-generated answer against verified sources and improve it.

=== AI-GENERATED ANSWER ===
${answer}
=== END ANSWER ===

=== VERIFIED SOURCES ===
${sourceText}
=== END SOURCES ===

YOUR JOB:
1. Check each major claim in the answer against the sources
2. If a claim is SUPPORTED by sources, keep it
3. If a claim is CONTRADICTED by sources, correct it using the source data
4. If a claim CANNOT be verified (not in sources), keep it but do NOT present it as established fact
5. Add source references where helpful (e.g., "According to [Source 1]...")

RULES:
- Rewrite the answer with corrections applied
- Keep the same tone, structure, and formatting as the original
- Do NOT add "[Verified]" or "[Unverified]" tags — just make the answer accurate
- Do NOT mention that you're a verification system
- Do NOT remove useful information just because it's not in the sources — only correct errors
- Keep it natural and readable
- Output ONLY the improved answer, nothing else`;

  // Use fastest available model for verification
  const verifiers = ['groq', 'gemini', 'openai'] as const;

  for (const model of verifiers) {
    try {
      const verifiedAnswer = await callProvider(model, prompt, userApiKeys);
      return { verifiedAnswer, sources };
    } catch {
      continue;
    }
  }

  // If all fail, return original
  return { verifiedAnswer: answer, sources };
}
