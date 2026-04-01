import { AIResponse } from '@/types';
import { PROVIDERS } from './constants';

function formatHistory(history?: { role: string; content: string }[]): string {
  if (!history || history.length === 0) return '';
  const lines = history.map((m) => {
    const label = m.role === 'user' ? 'User' : 'HiveMinds';
    return `${label}: ${m.content}`;
  });
  return `\nConversation so far:\n${lines.join('\n')}\n`;
}

export function getInitialPrompt(
  providerName: string,
  question: string,
  history?: { role: string; content: string }[]
): string {
  const display = PROVIDERS[providerName]?.displayName ?? providerName;
  const historyBlock = formatHistory(history);
  return `You are ${display}, one of 5 AIs in a roundtable debate. Each AI answers independently first, then you'll all see each other's answers and debate.
${historyBlock}
User's question: "${question}"

RULES:
- Give YOUR unique perspective and answer. Don't hedge or be generic.
- If the user asks you to DO something (write, create, fix, etc.), DO IT directly.
- If it's a follow-up ("do it", "yes", "make it longer"), use conversation history to understand what they want.
- Be direct and confident. Take a clear position.
- Match length to complexity. Simple = 1-3 sentences. Complex = as long as needed.
- Sign off with a bold claim or key takeaway that other AIs can challenge.`;
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

  return `You are ${display} in round ${round} of a heated AI roundtable debate.

User asked: "${question}"

Here's what everyone said in the previous round:
${responsesText}

NOW DEBATE. You MUST:
1. Call out other AIs BY NAME — "I disagree with Gemini because..." or "Llama makes a good point about X, but misses Y"
2. Challenge at least one thing another AI said. Find a flaw, a missing angle, or a better way to frame it.
3. Defend YOUR position if someone challenged you, or update it if they made a good point. Say "I was wrong about X" if needed.
4. Add something NEW that nobody else mentioned yet.

DO NOT just say "I agree with everyone." That's boring and useless. Push back. Be specific. Name names.
Keep it punchy — 2-4 sentences max. This is a debate, not an essay.`;
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

  return `Do these AI responses substantially agree on the core answer to "${question}"? Minor wording differences don't count — only major disagreements matter.

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

  const totalResponses = allRounds.reduce((sum, r) => sum + r.responses.length, 0);
  const uniqueProviders = new Set(allRounds.flatMap((r) => r.responses.map((resp) => resp.provider)));

  return `You watched ${uniqueProviders.size} AIs debate this question across ${allRounds.length} round(s) with ${totalResponses} total responses.
${historyBlock}
User asked: "${question}"

The debate:
${discussionText}

Now write the FINAL answer. Rules:
- Combine the best insights from the debate into ONE clean, direct answer.
- If the user asked you to DO something (write, create, rewrite), DO IT. Don't summarize the debate.
- If AIs disagreed on something, mention the strongest argument from each side briefly, then give your verdict.
- Write like a smart friend explaining something — natural, direct, no fluff.
- NEVER say "the AIs agreed" or "the panel concluded" or list what each AI said. Just answer.
- If it's a follow-up, use conversation history to understand context.`;
}
