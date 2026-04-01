import { DiscussionMode } from '@/types';

const COMPLEX_KEYWORDS = [
  'compare', 'explain', 'analyze', 'why', 'how does', 'how do', 'how can',
  'what should', 'what would', 'strategy', 'trade-off', 'tradeoff', 'pros and cons',
  'best way', 'recommend', 'suggest', 'opinion', 'difference between', 'versus', ' vs ',
  'debug', 'refactor', 'optimize', 'architecture', 'design', 'implement',
  'help me', 'write a', 'create a', 'build a', 'plan for',
];

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
