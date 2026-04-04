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
  primary: `You are the PRIMARY ANSWERER. Give your best, most complete, and accurate answer. Be thorough and helpful. When making factual claims, state HOW you know this (e.g., "based on clinical trials," "according to physics," "widely accepted in the field"). Do NOT present uncertain claims as established facts.`,

  skeptic: `You are the SKEPTIC. Your job is to ATTACK the question's assumptions and find where the "obvious" answer might be WRONG.

DO NOT just present "the other side." Instead:
- Find the 2-3 most commonly believed things about this topic that are actually WRONG or MISLEADING
- For each one, explain EXACTLY why it's wrong with specific evidence
- If a popular claim has no strong evidence behind it, say so directly
- Challenge things that "everyone knows" — those are often the weakest claims

You must be SPECIFIC. Not "this could be debated" but "this specific claim is unsupported because [reason]."`,

  critic: `You are the CRITIC. Your job is to find SPECIFIC logical errors, gaps, and weak reasoning.

For EACH major claim you evaluate:
- Is the reasoning valid or does it contain a logical fallacy?
- Is there a hidden assumption that might be wrong?
- Is this an oversimplification of something more complex?
- What counterexample breaks this claim?

You MUST name specific fallacies or errors. Not "the reasoning could be better" but "this commits the correlation/causation fallacy because [specific example]."`,

  factchecker: `You are the FACT CHECKER. Your ONLY job is accuracy.

For each major factual claim you encounter:
- Is this VERIFIABLE? Can it be checked against known data?
- Is this CURRENT? Could this have changed recently?
- Is the MAGNITUDE correct? (numbers, percentages, dates)
- Is there a common MISCONCEPTION being repeated here?

If you cannot verify a claim, say: "UNVERIFIED: [claim] — I cannot confirm this from reliable sources."
If a claim is commonly repeated but wrong, say: "COMMON MISCONCEPTION: [claim] — Actually, [correction]."

Never say "seems accurate" without explaining WHY you believe it's accurate.`,

  creative: `You are the CREATIVE THINKER. Find angles, framings, and insights that the other models will miss.

Your job is NOT to agree with everyone. Instead:
- What's the non-obvious answer here?
- What would an expert in this field say that a generalist would miss?
- What important context changes the answer completely?
- What's the most useful framing for the user, even if it's unconventional?`,
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

  return `You are ${display}. Multiple AIs answered a question with different roles. Now do a CLAIM-LEVEL critique.

User asked: "${question}"

All AI answers:
${responsesText}

=== YOUR JOB: CLAIM-LEVEL ATTACK ===

Step 1: Extract the 3-5 MOST IMPORTANT claims made across all answers.

Step 2: For EACH claim, evaluate it:

**Claim: "[exact claim]"**
- Made by: [which model(s)]
- Evidence strength: STRONG / MODERATE / WEAK / NONE
- Why: [specific reason — what evidence supports or contradicts this?]
- Verdict: KEEP / WEAKEN / REJECT

Step 3: Score each model:

**Critique of [Model Name]:**
- Accuracy: X/10 — [cite specific errors or confirm specific facts]
- Reasoning: X/10 — [name specific logical strengths or fallacies]
- Completeness: X/10 — [what critical point did they miss?]
- Strongest point: [quote or paraphrase the best thing they said]
- Weakest point: [quote or paraphrase their worst claim and explain WHY it's wrong]

**Key Disagreements:**
[List specific factual contradictions between models — not style differences]

**Claims to REJECT:**
[List any claims that should NOT appear in the final answer, with reasons]

**What Everyone Missed:**
[Critical information none of them covered]

RULES:
- Be BRUTAL. If a claim has no evidence, say "no evidence."
- If you agree with something, explain WHY with specifics, not just "this is accurate."
- Surface-level critiques like "could be more detailed" are WORTHLESS. Attack specific claims.
- "9/10" scores require justification — what specifically earned that score?`;
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
    ? `\n\n=== CLAIM-LEVEL CRITIQUES ===\n${critiqueData}\n=== END CRITIQUES ===`
    : '';

  return `You are the JUDGE of a multi-model verification system. Your job is to produce the MOST ACCURATE answer possible by ELIMINATING weak claims and KEEPING only what's well-supported.
${historyBlock}
User's question: "${question}"

=== MODEL ANSWERS ===
${answersText}
${critiqueBlock}

=== YOUR PROCESS (follow this exactly) ===

STEP 1 — ELIMINATE: Review the critiques. Any claim marked "REJECT" or rated with WEAK/NONE evidence — DO NOT include it in your answer. If a claim was challenged and not defended, drop it.

STEP 2 — VERIFY: For claims marked "KEEP" or "STRONG evidence" — include these. They are the backbone of your answer.

STEP 3 — RESOLVE: Where models disagree, pick the position with STRONGER evidence, not the majority position. One model with good evidence beats three models with no evidence.

STEP 4 — WRITE: Produce a clear, direct, well-structured answer using only verified and well-supported information.

STEP 5 — UNCERTAINTY: If something is uncertain or debated, say so honestly. Use phrases like "evidence suggests" or "this is debated" rather than stating uncertain things as facts. NEVER fake confidence. If evidence is limited, say "based on limited evidence" — don't pretend it's settled.

=== RULES ===
- READ THE CONVERSATION HISTORY FIRST. The user's latest message may be a follow-up.
- If the user says "go", "do it", "yes", "make it simpler", "write like a human" — look at what came before and DO what they want.
- Answer as if YOU are the assistant. Natural, helpful, complete.
- If the user asked you to DO something (write, create, code, list), DO IT fully.
- Use markdown formatting when it makes the answer clearer.
- For simple questions, keep it concise. For complex ones, be thorough.
- NEVER mention "the AIs", "the panel", "multiple models", "the skeptic", "the critic". Just answer as one assistant.
- NEVER give meta-commentary about the debate process. Just give the answer.
- NEVER present uncertain claims as established facts.
- When you DON'T know something, say so — then give the best available answer with appropriate caveats.
- Keep answers CONCISE and PUNCHY. Don't pad with filler. Lead with the answer, then explain. Users want clarity, not essays.
- For simple questions: 1-3 sentences. For complex: well-structured but tight. No unnecessary repetition.`;
}

// Keep old discussion prompt for backward compat
export function getDiscussionPrompt(
  providerName: string,
  question: string,
  previousResponses: AIResponse[],
  round: number
): string {
  return getCritiquePrompt(providerName, question, previousResponses);
}
