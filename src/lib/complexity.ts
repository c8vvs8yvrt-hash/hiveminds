/**
 * Detect whether a question is simple (instant answer) or complex (needs discussion).
 * Simple: math, factual lookups, definitions, yes/no questions
 * Complex: opinions, analysis, comparisons, "how to", strategy, creative
 */
export function isSimpleQuestion(question: string): boolean {
  const q = question.toLowerCase().trim();

  // Math expressions: "5*5", "what is 2+2", "100/4"
  if (/^\d[\d\s+\-*/().^%]+\d$/.test(q.replace(/\s/g, ''))) return true;
  if (/^what\s+(is|are|'s)\s+\d[\d\s+\-*/().^%]+\d\s*\??$/i.test(q)) return true;

  // Very short factual questions (under 8 words, starts with who/what/when/where)
  const words = q.split(/\s+/);
  if (words.length <= 6 && /^(what|who|when|where|how much|how many|how old|how tall|how far)\b/.test(q)) {
    // Exclude "how to" and "what should" (those are complex)
    if (!/^(how to|how do|how can|how should|what should|what would|what could)/.test(q)) {
      return true;
    }
  }

  // Simple definitions: "define X", "what does X mean"
  if (/^define\s+\w+\s*\??$/.test(q)) return true;
  if (/^what\s+does\s+\w+\s+mean\s*\??$/.test(q)) return true;

  // Yes/no factual: "is X a Y", "are X Y", "does X Y" (short ones)
  if (words.length <= 6 && /^(is|are|does|did|was|were|can|do)\s/.test(q)) return true;

  // Translations: "how do you say X in Y"
  if (/^(how\s+do\s+you\s+say|translate)\b/.test(q) && words.length <= 10) return true;

  // Capital/president/population type questions
  if (/^what\s+(is|'s)\s+the\s+(capital|president|population|currency|flag)\b/.test(q)) return true;

  return false;
}
