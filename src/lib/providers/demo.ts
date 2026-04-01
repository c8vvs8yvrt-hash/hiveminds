import { ProviderName } from '@/types';

const DEMO_ROUND1: Record<string, string> = {
  gemini: "Great question! From my analysis, the most important factor here is practical application. You can study theory all day, but real understanding comes from hands-on experience. I'd recommend starting with small, manageable projects and gradually increasing complexity. The data shows that people who learn by doing retain 75% more than those who only read about it.",
  groq: "Honestly? The biggest mistake people make is overthinking this. Just start doing it. The 'perfect' approach doesn't exist — what works is consistency and willingness to fail. That said, having a mentor or community helps enormously. Don't try to go it alone when there are tons of people who've already figured out the hard parts.",
  mistral: "That's a great question! Let me break it down with a structured approach. Based on current research and practical experience, here are the key considerations you should keep in mind. First, it's important to understand the fundamentals before diving into specifics. The most effective strategy combines theoretical knowledge with hands-on practice.",
  cohere: "I'd approach this by first considering what your specific goals are, as the best path forward depends heavily on context. That said, there are some universal principles: start with fundamentals, build progressively, seek feedback, and iterate. The most successful approach I've seen combines structured learning with creative exploration.",
  openrouter: "Based on recent research and expert opinions, the most effective approach involves a blend of structured learning and practical application. Studies show that active recall and spaced repetition significantly improve retention. I'd also recommend leveraging current tools and resources — there are more high-quality free resources available now than ever before.",
};

const DEMO_ROUND2: Record<string, string> = {
  gemini: "Mistral makes a fair point about theory — I'll concede that some foundational knowledge is necessary before jumping in. But I stand by my emphasis on practical learning. Building on what Llama said about mistakes, I think making mistakes early is actually beneficial — it accelerates learning. The consensus seems to be: get enough theory to be dangerous, then start building.",
  groq: "Alright, I'll give Mistral and Gemini credit — some structure helps. My initial take was maybe too casual. The sweet spot is probably what we're all converging on: a balance of structured learning and practical experimentation. I especially like Gemini's point about small projects. Start small, fail fast, iterate. That's the real answer here.",
  mistral: "I agree with Gemini's point about practical application — that's crucial. However, I'd add that having a solid conceptual foundation first makes the practical work much more efficient. Llama raises a valid concern about common pitfalls, and I think the best approach combines all our perspectives: learn the theory, practice early, and stay aware of common mistakes.",
  cohere: "The discussion has been really productive. I think we're converging on a clear answer: combine theoretical foundations (as Mistral emphasized) with practical, project-based learning (as Gemini and Llama advocated). The key insight from this roundtable is that these approaches aren't competing — they're complementary.",
  openrouter: "I agree with the emerging consensus. The research supports what everyone is saying: structured fundamentals + hands-on practice + community support is the winning formula. One additional data point: people who set specific, measurable goals are 42% more likely to succeed. So whatever approach you choose, make sure you define clear milestones.",
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getDemoResponse(
  provider: ProviderName,
  round: number,
): Promise<string> {
  // Simulate network delay (1-3 seconds)
  const delayMs = 1000 + Math.random() * 2000;
  await delay(delayMs);

  if (round === 1) {
    return DEMO_ROUND1[provider] ?? "I have some thoughts on this topic that I'd like to share with the group.";
  }
  return DEMO_ROUND2[provider] ?? "I agree with the points raised by the other participants. The consensus approach seems sound.";
}

export const DEMO_CONSENSUS = `Based on the roundtable discussion, here's the best approach:

**Start with a foundation, then build through practice.**

1. **Learn the fundamentals first** — Get enough theoretical knowledge to understand the basics. Don't try to master everything upfront, just enough to get started.

2. **Start building immediately** — Small, manageable projects are the key. The research shows that hands-on learners retain 75% more than passive learners.

3. **Embrace failure** — Making mistakes early actually accelerates learning. Don't aim for perfection; aim for progress.

4. **Find a community** — Having mentors and peers to learn from makes a huge difference. Don't go it alone.

5. **Set clear goals** — People who define specific milestones are 42% more likely to succeed.

The AIs unanimously agreed that the best results come from combining structured learning with practical experimentation — these approaches complement each other rather than competing.`;
