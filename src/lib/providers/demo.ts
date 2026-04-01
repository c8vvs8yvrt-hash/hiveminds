import { ProviderName } from '@/types';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a question-aware demo response.
 * These simulate what a real AI roundtable would look like.
 */
export async function getDemoResponse(
  provider: ProviderName,
  round: number,
  question: string,
): Promise<string> {
  // Simulate network delay (0.5-1.5 seconds)
  const delayMs = 500 + Math.random() * 1000;
  await delay(delayMs);

  const q = question.trim();

  if (round === 1) {
    return getRound1Response(provider, q);
  }
  return getRound2Response(provider, q);
}

function getRound1Response(provider: ProviderName, question: string): string {
  const responses: Record<string, string> = {
    gemini: `Looking at "${question}" — this is a great topic to explore. From my analysis, the key factors to consider are the context, the practical implications, and the evidence available. I'd approach this by first breaking down the core concepts, then examining how they apply in real-world scenarios. The data suggests that a nuanced understanding is essential here, as oversimplified answers tend to miss critical details.`,

    groq: `Regarding "${question}" — let me be straightforward here. The most important thing people overlook is that there's rarely one right answer. It depends heavily on your specific situation and goals. That said, I think the best starting point is to understand the fundamentals clearly before making any decisions. Common mistakes include jumping to conclusions without considering all the angles.`,

    mistral: `That's an excellent question: "${question}". Let me provide a structured analysis. There are several dimensions to consider here. First, the theoretical framework — what does established knowledge tell us? Second, the practical application — how does this play out in reality? And third, the personal context — what matters most for your specific situation? I believe a comprehensive answer needs to address all three.`,

    cohere: `Regarding "${question}" — I think context is everything here. The answer varies significantly depending on your goals, your current situation, and what trade-offs you're willing to make. That said, there are some universal principles worth considering: look at the evidence, consider multiple perspectives, and don't be afraid to question conventional wisdom. Let me elaborate on each of these.`,

    openrouter: `"${question}" is something I've analyzed extensively. Based on current research and expert consensus, there are a few key insights worth highlighting. The landscape has evolved significantly in recent years, and what was true even a few years ago may not apply today. I'd recommend focusing on the most up-to-date information and being wary of outdated advice. Here's what the latest evidence suggests.`,
  };

  return responses[provider] ?? `That's an interesting question about "${question}". Let me share my perspective with the group.`;
}

function getRound2Response(provider: ProviderName, question: string): string {
  const responses: Record<string, string> = {
    gemini: `Building on what everyone has said about "${question}" — I think Mistral's structured approach is really valuable here, and I agree with Llama about the importance of not oversimplifying. Where I'd push back slightly is on the idea that context is everything (as Cohere suggested). While context matters, there ARE some universal truths here that apply broadly. I think we're converging on a solid answer.`,

    groq: `Good discussion so far on "${question}". I'll admit Gemini and Mistral raised points I hadn't fully considered. The structured approach combined with practical experience does seem to be the winning formula. I still think simplicity is underrated — don't overcomplicate this — but I see the value in being more thorough. DeepSeek's point about recent changes is well-taken too.`,

    mistral: `I appreciate the thoughtful responses from everyone on "${question}". Gemini's emphasis on evidence-based thinking aligns with my structured approach. I also think Llama makes a fair point about avoiding overthinking. The consensus seems clear: understand the fundamentals, apply them practically, and stay current. Cohere's emphasis on multiple perspectives rounds this out nicely.`,

    cohere: `This has been a productive discussion about "${question}". I notice we're all arriving at similar conclusions from different angles, which gives me confidence in the answer. The key themes emerging are: evidence-based thinking (Gemini), practical simplicity (Llama), structured analysis (Mistral), and staying current (DeepSeek). These aren't competing approaches — they're complementary.`,

    openrouter: `I agree with the emerging consensus on "${question}". Everyone has brought valuable perspectives. The research supports this multi-faceted approach: combine solid fundamentals with practical application, stay updated with current developments, and don't be afraid to adapt your thinking. I think we've reached a well-rounded answer that covers the key bases.`,
  };

  return responses[provider] ?? `I agree with the points raised about "${question}". The consensus approach seems sound.`;
}

export function getDemoConsensus(question: string): string {
  return `Regarding **"${question}"**, here's what the AI roundtable concluded:

The panel discussed this from multiple angles and reached a strong consensus on the key points:

1. **Understand the fundamentals first** — Before diving into specifics, it's essential to grasp the core concepts. A solid foundation makes everything else more effective.

2. **Context matters significantly** — The best answer depends on your specific situation, goals, and constraints. There's rarely a one-size-fits-all solution.

3. **Look at the evidence** — Base your understanding on current, reliable information rather than assumptions or outdated conventional wisdom.

4. **Consider multiple perspectives** — Different viewpoints often reveal insights that a single perspective would miss. The most robust answers integrate diverse approaches.

5. **Apply practically** — Knowledge without application has limited value. Test your understanding through real-world experience and iterate based on results.

The AIs agreed that the best approach combines structured thinking with practical application — and that staying open to new information is crucial as understanding evolves.

*To get detailed, question-specific answers powered by real AI models, add your free API keys in Settings (⚙️) or upgrade to Pro.*`;
}
