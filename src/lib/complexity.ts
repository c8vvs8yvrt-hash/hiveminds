import { DiscussionMode } from '@/types';

const COMPLEX_KEYWORDS = [
  'compare', 'explain', 'analyze', 'why', 'how does', 'how do', 'how can',
  'what should', 'what would', 'strategy', 'trade-off', 'tradeoff', 'pros and cons',
  'best way', 'recommend', 'suggest', 'opinion', 'difference between', 'versus', ' vs ',
  'debug', 'refactor', 'optimize', 'architecture', 'design', 'implement',
  'help me', 'write a', 'write me', 'create a', 'build a', 'plan for',
  'essay', 'code for', 'tutorial', 'guide', 'step by step', 'in detail',
];

const SIMPLE_PATTERNS = [
  /^what is \d+[\s]*[+\-*/×÷]\s*\d+/i,
  /^how much is \d+/i,
  /^calculate /i,
  /^define /i,
  /^what does .{1,30} mean\??$/i,
  /^what is the capital of /i,
  /^who is /i,
  /^when (was|is|did) /i,
  /^where is /i,
  /^(what|which) (year|day|month|date) /i,
  /^(true or false|yes or no)[:\s]/i,
  /^(translate|convert) /i,
  /^\d+\s*[+\-*/×÷^%]\s*\d+\s*=?\s*$/,
];

/**
 * Detect trivially simple questions (math, definitions, quick facts).
 * These can skip debate entirely.
 */
export function isSimpleQuestion(question: string): boolean {
  const q = question.trim();
  const words = q.split(/\s+/);

  // Very short (1-4 words) and no complex keywords
  if (words.length <= 4 && !COMPLEX_KEYWORDS.some((kw) => q.toLowerCase().includes(kw))) {
    return true;
  }

  // Matches a simple pattern
  if (SIMPLE_PATTERNS.some((p) => p.test(q))) {
    return true;
  }

  return false;
}

/**
 * Determine if auto-switch should upgrade from Instant to Thinking.
 */
export function shouldAutoUpgrade(question: string): boolean {
  const q = question.toLowerCase().trim();
  const words = q.split(/\s+/);

  // Long questions are usually complex
  if (words.length > 12) return true;

  // Multiple sentences
  if ((q.match(/[.!?]/g) || []).length >= 2) return true;

  // Contains code blocks
  if (q.includes('```') || q.includes('function ') || q.includes('const ') || q.includes('import ')) return true;

  // Contains complex keywords
  if (COMPLEX_KEYWORDS.some((kw) => q.includes(kw))) return true;

  return false;
}

/**
 * Get the effective mode after auto-switch logic.
 */
export function getEffectiveMode(
  selectedMode: DiscussionMode,
  question: string,
  autoSwitch: boolean
): { mode: DiscussionMode; wasUpgraded: boolean } {
  if (selectedMode !== 'instant' || !autoSwitch) {
    return { mode: selectedMode, wasUpgraded: false };
  }

  if (shouldAutoUpgrade(question)) {
    return { mode: 'thinking', wasUpgraded: true };
  }

  return { mode: 'instant', wasUpgraded: false };
}
