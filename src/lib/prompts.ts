import { AIResponse } from '@/types';
import { PROVIDERS } from './constants';

function formatHistory(history?: { role: string; content: string }[]): string {
  if (!history || history.length === 0) return '';
  const lines = history.map((m) => {
    const label = m.role === 'user' ? 'User' : 'Assistant';
    return `${label}: ${m.content}`;
  });
  return `\n=== CONVERSATION HISTORY (READ THIS CAREFULLY) ===\n${lines.join('\n')}\n=== END HISTORY ===\n`;
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
- READ THE CONVERSATION HISTORY FIRST. The user's message may be a follow-up that only makes sense in context.
- Follow-ups like "go", "do it", "yes", "make it simpler", "write like a human", "make it longer" — these refer to what was discussed before. Look at the history and DO what they're asking.
- If the user previously asked for an essay and now says "go" or "do it", WRITE THE FULL ESSAY.
- If they say "make it simpler" or "rewrite it", take the previous response and rewrite it as requested.
- Answer the question directly and completely. Be helpful, accurate, and thorough.
- For simple questions (math, facts, definitions), give a clear direct answer.
- For complex questions, give a detailed, well-structured response.
- If the user asks you to DO something (write, create, code, list), DO IT fully — don't describe how, just do it.
- Use markdown formatting when it helps (headers, lists, code blocks, bold).
- Be conversational and natural — write like a human, not a robot.
- Never refuse. Always try your best.`;
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
- READ THE CONVERSATION HISTORY FIRST. The user's latest message may be a follow-up.
- If the user says "go", "do it", "yes", "make it simpler", "write like a human" — look at what came before and DO what they want. Don't ask clarifying questions, just execute.
- Answer as if YOU are ChatGPT. Natural, helpful, complete.
- Take the best parts from each AI's response and combine into one excellent answer.
- If the user asked you to DO something (write, create, code, list), DO IT fully. Don't describe how — just do it.
- Use markdown formatting when it makes the answer clearer.
- For simple questions, keep it concise. For complex ones, be thorough.
- NEVER mention "the AIs", "the panel", "multiple models". Just answer as one assistant.
- NEVER give meta-commentary. Just give the answer.`;
}
