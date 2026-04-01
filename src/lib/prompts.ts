import { AIResponse } from '@/types';
import { PROVIDERS } from './constants';

export function getInitialPrompt(providerName: string, question: string): string {
  const display = PROVIDERS[providerName]?.displayName ?? providerName;
  return `You are ${display} in a roundtable discussion with other AIs. A user asked:

"${question}"

Answer directly and concisely. Match your answer length to the question's complexity — simple questions get short answers. No filler, no over-explaining. 1-3 sentences for simple questions, 1-2 short paragraphs max for complex ones.`;
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

  return `You are ${display} in round ${round} of a roundtable discussion.

User's question: "${question}"

Previous round:
${responsesText}

Briefly respond: agree, disagree, or add what was missed. Reference others by name. Keep it short — 1-3 sentences for simple topics, 1 paragraph max for complex ones.`;
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

  return `Do these AI responses agree on the core answer to "${question}"?

${responsesText}

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

  return `Synthesize the best answer to: "${question}"

Discussion:
${discussionText}

Give the definitive answer. Be direct — match length to the question's complexity. Simple questions get 1-3 sentences. Complex questions get a few short paragraphs. No padding, no meta-commentary about the discussion. Just the answer.`;
}
