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
 * Run claim-level verification on the synthesized answer.
 * Checks each major claim against sources and corrects or caveats unsupported ones.
 */
export async function verifyAnswer(
  answer: string,
  sources: SearchResult[],
  userApiKeys?: UserApiKeys
): Promise<VerificationResult> {
  if (sources.length === 0) {
    return { verifiedAnswer: answer, sources: [] };
  }

  const sourceText = sources
    .map((s, i) => `[${i + 1}] (${s.tierLabel}) ${s.title}: ${s.snippet}`)
    .join('\n');

  const prompt = `You are a CLAIM-LEVEL FACT VERIFICATION system. Check an AI answer against verified sources.

=== AI-GENERATED ANSWER ===
${answer}
=== END ANSWER ===

=== VERIFIED SOURCES ===
${sourceText}
=== END SOURCES ===

=== YOUR PROCESS ===

1. Identify each MAJOR FACTUAL CLAIM in the answer
2. For each claim, check if it is SUPPORTED, CONTRADICTED, or UNVERIFIABLE from the sources
3. Apply fixes:

If SUPPORTED → keep the claim as-is
If CONTRADICTED → correct it using the source data
If UNVERIFIABLE → keep the claim BUT add appropriate hedging language:
   - Change "X is true" → "X is generally believed" or "evidence suggests X"
   - Do NOT remove useful information just because sources don't cover it
   - Only hard-correct claims that sources ACTIVELY CONTRADICT

=== RULES ===
- Output ONLY the improved answer — no meta-commentary
- Keep the exact same tone, structure, and formatting as the original
- Do NOT add "[Verified]" or "[Unverified]" tags
- Do NOT mention that you're a verification system
- Do NOT strip the answer down — keep it helpful and complete
- Make corrections seamlessly — the user should not notice the verification happened
- If the answer references specific numbers, dates, or statistics, verify those specifically`;

  const verifiers = ['groq', 'gemini', 'openai'] as const;

  for (const model of verifiers) {
    try {
      const verifiedAnswer = await callProvider(model, prompt, userApiKeys);
      return { verifiedAnswer, sources };
    } catch {
      continue;
    }
  }

  return { verifiedAnswer: answer, sources };
}
