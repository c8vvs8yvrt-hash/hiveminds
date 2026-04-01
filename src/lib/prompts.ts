import { AIResponse } from '@/types';
import { PROVIDERS } from './constants';

function formatHistory(history?: { role: string; content: string }[]): string {
  if (!history || history.length === 0) return '';
  const lines = history.map((m) => {
    const label = m.role === 'user' ? 'User' : 'HiveMinds';
    return `${label}: ${m.content}`;
  });
  return `\n\nConversation so far:\n${lines.join('\n')}\n`;
}

export function getInitialPrompt(
  providerName: string,
  question: string,
  history?: { role: string; content: string }[]
): string {
  const display = PROVIDERS[providerName]?.displayName ?? providerName;
  const historyBlock = formatHistory(history);
  return `You are ${display} in a roundtable discussion with other AIs. ${historyBlock}
The user's latest message: "${question}"

IMPORTANT RULES:
- If the user asks you to DO something (write, rewrite, create, fix, expand, etc.), DO IT. Don't explain how — just do the task.
- If it's a follow-up like "do it", "yes", "go ahead", "make it longer", look at the conversation history to understand what they want and do it.
- Answer directly. Match length to complexity. Simple questions = 1-3 sentences. Complex tasks = as long as needed.
- Never say "I can't do that" — just do your best.`;
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
  allRounds: { number: number; responses: AIResponse[] }[],
  history?: { role: string; content: string }[]
): string {
  const historyBlock = formatHistory(history);
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

  return `Answer this question as if you are ChatGPT giving a single clean response. ${historyBlock}
The user's latest message: "${question}"

You have access to what multiple AIs discussed:
${discussionText}

RULES:
- Use their best insights but write ONE clean, natural answer.
- If the user asked you to DO something (write, rewrite, create, expand, etc.), DO THE TASK directly. Don't give advice about how to do it.
- If it's a follow-up like "just do it" or "yes", look at the conversation history and complete the task they're referring to.
- Write like a helpful AI assistant — not like a summary or report.
- Never say "the AIs agreed" or "the panel concluded." Never list what each AI said.
- Just answer the question or do the task directly.`;
}
