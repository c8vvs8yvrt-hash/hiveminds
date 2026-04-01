import { AIResponse } from '@/types';
import { PROVIDERS } from './constants';

export function getInitialPrompt(providerName: string, question: string): string {
  const display = PROVIDERS[providerName]?.displayName ?? providerName;
  return `You are ${display}, an AI assistant sitting at a roundtable discussion with other AI assistants (Gemini, Llama, Cohere, and Qwen). A user has asked all of you this question:

"${question}"

Give your best, concise answer. Be direct, informative, and share your unique perspective. Keep it to 2-3 paragraphs max.`;
}

export function getDiscussionPrompt(
  providerName: string,
  question: string,
  previousResponses: AIResponse[],
  round: number
): string {
  const display = PROVIDERS[providerName]?.displayName ?? providerName;
  const responsesText = previousResponses
    .map((r) => {
      const name = PROVIDERS[r.provider]?.displayName ?? r.provider;
      return `**${name}**: ${r.content}`;
    })
    .join('\n\n');

  return `You are ${display} in round ${round} of a roundtable discussion with other AI assistants.

The user's question: "${question}"

Here's what everyone said in the previous round:
${responsesText}

Now respond to the discussion. You should:
- Agree with points you think are correct and say why
- Respectfully push back on anything you think is wrong or incomplete
- Add important information others missed
- Build on the best ideas from the group
- Reference other AIs by name when agreeing or disagreeing

Keep your response concise (1-2 paragraphs). Be conversational — this is a discussion, not an essay.`;
}

export function getConvergencePrompt(
  question: string,
  responses: AIResponse[]
): string {
  const responsesText = responses
    .map((r) => {
      const name = PROVIDERS[r.provider]?.displayName ?? r.provider;
      return `**${name}**: ${r.content}`;
    })
    .join('\n\n');

  return `Multiple AI assistants are discussing this question: "${question}"

Here are their latest responses:
${responsesText}

Do these responses substantially agree on the key points and recommendations? Minor differences in wording are fine — focus on whether they agree on the core answer.

Reply with ONLY "YES" or "NO".`;
}

export function getSynthesisPrompt(
  question: string,
  allRounds: { number: number; responses: AIResponse[] }[]
): string {
  const discussionText = allRounds
    .map((round) => {
      const header = `--- Round ${round.number} ---`;
      const responses = round.responses
        .map((r) => {
          const name = PROVIDERS[r.provider]?.displayName ?? r.provider;
          return `**${name}**: ${r.content}`;
        })
        .join('\n\n');
      return `${header}\n${responses}`;
    })
    .join('\n\n');

  return `Multiple AI assistants had a roundtable discussion about the following question:

"${question}"

Here is their full discussion:
${discussionText}

Now synthesize the BEST possible answer by:
1. Combining the strongest, most accurate points from all participants
2. Where they disagreed, go with the most well-reasoned position
3. Present a clear, comprehensive, and actionable answer
4. If there were significant disagreements, briefly note them at the end

Write your response as the definitive answer to the user's question. Be thorough but concise. Do NOT mention that you're synthesizing from a discussion — just give the best answer directly.`;
}
