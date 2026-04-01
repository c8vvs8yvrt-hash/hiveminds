import { AIResponse } from '@/types';
import { PROVIDERS } from './constants';

function formatHistory(history?: { role: string; content: string }[]): string {
  if (!history || history.length === 0) return '';
  const lines = history.map((m) => {
    const label = m.role === 'user' ? 'User' : 'Assistant';
    return `${label}: ${m.content}`;
  });
  return `\nPrevious conversation:\n${lines.join('\n')}\n`;
}

export function getInitialPrompt(
  providerName: string,
  question: string,
  history?: { role: string; content: string }[]
): string {
  const display = PROVIDERS[providerName]?.displayName ?? providerName;
  const historyBlock = formatHistory(history);
  return `You are ${display}, a highly knowledgeable AI assistant. Answer the user's question thoroughly and accurately, just like ChatGPT or Gemini would.
${historyBlock}
User: ${question}

Instructions:
- Answer the question directly and completely. Be helpful, accurate, and thorough.
- For simple questions (math, facts, definitions), give a clear direct answer.
- For complex questions (explanations, how-tos, analysis), give a detailed, well-structured response with examples if helpful.
- If the user asks you to DO something (write an essay, create code, make a list, etc.), DO IT fully — don't just describe how.
- If this is a follow-up message (like "do it", "yes", "make it longer"), look at the conversation history to understand what they want and execute it.
- Use markdown formatting when it helps (headers, lists, code blocks, bold).
- Be conversational and natural — not robotic or overly formal.
- Never refuse to answer. Always try your best.`;
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
      return `${name}: ${r.content}`;
    })
    .join('\n\n');

  return `You are ${display} in round ${round} of a discussion with other AIs about the user's question.

User asked: "${question}"

Other AIs answered:
${responsesText}

Now respond:
- If you agree with the other answers, say so briefly and add anything they missed.
- If you disagree or see errors in what others said, call them out by name and explain why. Be specific — "Gemini said X but actually Y because Z."
- If someone's answer is incomplete or could be better, improve on it.
- Add any important information, examples, or nuance that was missed.
- Keep your response focused and useful — don't repeat what's already been said well.`;
}

export function getConvergencePrompt(
  question: string,
  responses: AIResponse[]
): string {
  const responsesText = responses
    .map((r) => {
      const name = PROVIDERS[r.provider]?.displayName ?? r.provider;
      return `${name}: ${r.content}`;
    })
    .join('\n\n');

  return `Do these AI responses substantially agree on the answer to "${question}"? Minor differences in wording don't count — only real factual disagreements or contradictions matter.

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
      const responses = round.responses
        .map((r) => {
          const name = PROVIDERS[r.provider]?.displayName ?? r.provider;
          return `${name}: ${r.content}`;
        })
        .join('\n\n');
      return responses;
    })
    .join('\n\n---\n\n');

  return `You are a world-class AI assistant. Multiple AI models discussed the user's question below. Use their best insights to write the definitive answer.
${historyBlock}
User's question: "${question}"

What the AIs said:
${discussionText}

Write your answer now. Rules:
- Answer as if YOU are ChatGPT responding directly to the user. Natural, helpful, complete.
- Take the best parts from each AI's response and combine them into one excellent answer.
- If the user asked you to DO something (write, create, code, list, explain), DO IT fully.
- If it's a follow-up ("do it", "yes", "expand on that"), look at conversation history and execute.
- Use markdown formatting (headers, lists, code blocks, bold) when it makes the answer clearer.
- For simple questions, keep it concise. For complex ones, be thorough.
- NEVER mention "the AIs", "the panel", "multiple models", or that this came from a discussion. Just answer naturally as one assistant.
- NEVER give a meta-commentary about the answer. Just give the answer.`;
}
