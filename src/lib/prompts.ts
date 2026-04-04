import { AIResponse, ModelRole } from '@/types';
import { PROVIDERS } from './constants';

function formatHistory(history?: { role: string; content: string }[]): string {
  if (!history || history.length === 0) return '';
  const lines = history.map((m) => {
    const label = m.role === 'user' ? 'User' : 'Assistant';
    return `${label}: ${m.content}`;
  });
  return `\n=== CONVERSATION HISTORY (READ THIS CAREFULLY) ===\n${lines.join('\n')}\n=== END HISTORY ===\n`;
}

const ROLE_INSTRUCTIONS: Record<ModelRole, string> = {
  primary: `You are the PRIMARY ANSWERER. Give your best, most complete, and accurate answer. Be thorough and helpful.`,
  skeptic: `You are the SKEPTIC. Your job is to question assumptions, challenge popular beliefs, and present opposing viewpoints. Play devil's advocate. If the mainstream answer seems obvious, dig into WHY it might be wrong or incomplete.`,
  critic: `You are the CRITIC. Your job is to find weaknesses, gaps, and errors in reasoning. Look for logical fallacies, missing context, oversimplifications, and unstated assumptions. Be constructive but ruthless.`,
  factchecker: `You are the FACT CHECKER. Focus on verifiable facts, data accuracy, and source reliability. Flag any claims that seem unsubstantiated or incorrect. Prioritize precision over comprehensiveness.`,
  creative: `You are the CREATIVE THINKER. Offer alternative framings, unexpected angles, and novel perspectives that others might miss. Think outside the box while staying relevant.`,
};

export function getInitialPrompt(
  providerName: string,
  question: string,
  history?: { role: string; content: string }[],
  role?: ModelRole,
  sourceContext?: string
): string {
  const display = PROVIDERS[providerName]?.displayName ?? providerName;
  const historyBlock = formatHistory(history);
  const roleInstruction = role ? ROLE_INSTRUCTIONS[role] : ROLE_INSTRUCTIONS.primary;
  const sourcesBlock = sourceContext || '';

  return `You are ${display}, a highly knowledgeable AI assistant. ${roleInstruction}
${historyBlock}${sourcesBlock}
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
- If VERIFIED REFERENCE SOURCES are provided above, USE THEM. Ground your answer in those facts. Prioritize source-backed claims over your own knowledge.
- If a source contradicts your knowledge, trust the source (especially Verified Sources).
- Never refuse. Always try your best.`;
}

export function getCritiquePrompt(
  providerName: string,
  question: string,
  allResponses: AIResponse[]
): string {
  const display = PROVIDERS[providerName]?.displayName ?? providerName;
  const responsesText = allResponses
    .map((r) => {
      const name = PROVIDERS[r.provider]?.displayName ?? r.provider;
      const roleLabel = r.role ? ` (${r.role.toUpperCase()})` : '';
      return `### ${name}${roleLabel}:\n${r.content}`;
    })
    .join('\n\n');

  return `You are ${display}. Multiple AIs answered the user's question with different roles. Now CRITIQUE their answers.

User asked: "${question}"

All AI answers:
${responsesText}

YOUR JOB — critique each answer. For EACH other AI's response, evaluate:

1. **Accuracy** (0-10): Are the facts correct? Any errors or misleading claims?
2. **Reasoning** (0-10): Is the logic sound? Any fallacies or gaps?
3. **Completeness** (0-10): Did they cover the key points? What's missing?

Also identify:
- The STRONGEST point from each answer
- The WEAKEST point or biggest error from each answer
- Any claims that directly CONTRADICT another model

Format your response as:

**Critique of [Model Name]:**
- Accuracy: X/10 — [brief explanation]
- Reasoning: X/10 — [brief explanation]
- Completeness: X/10 — [brief explanation]
- Strongest point: ...
- Weakest point: ...

**Key Disagreements:**
[List any factual contradictions between models]

**What Everyone Missed:**
[Anything important none of them covered]

Be specific and direct. Don't be nice — be accurate.`;
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
  critiqueData?: string,
  history?: { role: string; content: string }[]
): string {
  const historyBlock = formatHistory(history);

  // Round 1 answers
  const round1 = allRounds[0];
  const answersText = round1.responses
    .map((r) => {
      const name = PROVIDERS[r.provider]?.displayName ?? r.provider;
      const roleLabel = r.role ? ` (${r.role.toUpperCase()})` : '';
      return `### ${name}${roleLabel}:\n${r.content}`;
    })
    .join('\n\n');

  // Critique data if available
  const critiqueBlock = critiqueData
    ? `\n\n=== CRITIQUES AND SCORES ===\n${critiqueData}\n=== END CRITIQUES ===`
    : '';

  return `You are a world-class AI assistant and the JUDGE of a multi-model debate. Multiple AI models answered the user's question with different roles (Primary, Skeptic, Critic, Fact Checker, Creative). They then critiqued each other's answers.
${historyBlock}
User's question: "${question}"

=== MODEL ANSWERS ===
${answersText}
${critiqueBlock}

YOUR JOB AS JUDGE:
1. Identify the STRONGEST arguments across all models
2. Resolve any disagreements — pick the best-supported position
3. IGNORE weak or low-scoring models — weight your answer toward the highest-quality responses
4. Synthesize everything into ONE definitive answer

RULES:
- READ THE CONVERSATION HISTORY FIRST. The user's latest message may be a follow-up.
- If the user says "go", "do it", "yes", "make it simpler", "write like a human" — look at what came before and DO what they want.
- Answer as if YOU are the assistant. Natural, helpful, complete.
- If the user asked you to DO something (write, create, code, list), DO IT fully.
- Use markdown formatting when it makes the answer clearer.
- For simple questions, keep it concise. For complex ones, be thorough.
- NEVER mention "the AIs", "the panel", "multiple models", "the skeptic", "the critic". Just answer as one assistant.
- NEVER give meta-commentary about the debate process. Just give the answer.`;
}

// Keep old discussion prompt for backward compat but it's no longer used in main flow
export function getDiscussionPrompt(
  providerName: string,
  question: string,
  previousResponses: AIResponse[],
  round: number
): string {
  return getCritiquePrompt(providerName, question, previousResponses);
}
