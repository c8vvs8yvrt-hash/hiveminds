import { Round, UserApiKeys, ConfidenceInfo, ModelScore } from '@/types';
import { callProvider } from './providers';
import { getSynthesisPrompt } from './prompts';
import { PROVIDERS } from './constants';

/**
 * Parse critique text to extract scores for each model.
 * Looks for patterns like "Accuracy: 7/10", "Reasoning: 8/10", "Completeness: 6/10"
 */
function parseCritiqueScores(critiqueResponses: Round): Map<string, { accuracy: number[]; reasoning: number[]; completeness: number[] }> {
  const scores = new Map<string, { accuracy: number[]; reasoning: number[]; completeness: number[] }>();

  for (const resp of critiqueResponses.responses) {
    const text = resp.content;

    // Find all "Critique of [Model]:" sections
    const sections = text.split(/\*\*Critique of /i);
    for (const section of sections.slice(1)) {
      // Extract model name
      const nameMatch = section.match(/^([^:*]+)/);
      if (!nameMatch) continue;

      const modelName = nameMatch[1].trim().replace(/\*\*/g, '');

      // Find the provider key for this display name
      let providerKey = modelName.toLowerCase();
      for (const [key, config] of Object.entries(PROVIDERS)) {
        if (config.displayName.toLowerCase() === modelName.toLowerCase()) {
          providerKey = key;
          break;
        }
      }

      if (!scores.has(providerKey)) {
        scores.set(providerKey, { accuracy: [], reasoning: [], completeness: [] });
      }

      const entry = scores.get(providerKey)!;

      // Extract scores
      const accMatch = section.match(/Accuracy:\s*(\d+)\s*\/\s*10/i);
      const resMatch = section.match(/Reasoning:\s*(\d+)\s*\/\s*10/i);
      const compMatch = section.match(/Completeness:\s*(\d+)\s*\/\s*10/i);

      if (accMatch) entry.accuracy.push(parseInt(accMatch[1]));
      if (resMatch) entry.reasoning.push(parseInt(resMatch[1]));
      if (compMatch) entry.completeness.push(parseInt(compMatch[1]));
    }
  }

  return scores;
}

/**
 * Extract key disagreements from critique responses.
 */
function extractDisagreements(critiqueResponses: Round): string[] {
  const disagreements: string[] = [];

  for (const resp of critiqueResponses.responses) {
    const text = resp.content;

    // Look for "Key Disagreements:" section
    const disagreeMatch = text.match(/\*\*Key Disagreements?:\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
    if (disagreeMatch) {
      const lines = disagreeMatch[1].split('\n').filter((l) => l.trim().startsWith('-') || l.trim().startsWith('•'));
      for (const line of lines) {
        const cleaned = line.replace(/^[\s\-•]+/, '').trim();
        if (cleaned && cleaned.length > 10 && !disagreements.includes(cleaned)) {
          disagreements.push(cleaned);
        }
      }
    }

    // Look for "Weakest point" mentions
    const weakMatches = text.match(/Weakest point:\s*([^\n]+)/gi);
    if (weakMatches) {
      for (const m of weakMatches) {
        const cleaned = m.replace(/^Weakest point:\s*/i, '').trim();
        if (cleaned && cleaned.length > 10 && !disagreements.includes(cleaned)) {
          disagreements.push(cleaned);
        }
      }
    }
  }

  return disagreements.slice(0, 5);
}

/**
 * Extract "why this answer" reasoning from critiques.
 */
function extractWhyReasons(critiqueResponses: Round): string[] {
  const reasons: string[] = [];

  for (const resp of critiqueResponses.responses) {
    const text = resp.content;

    // Look for "Strongest point" mentions
    const strongMatches = text.match(/Strongest point:\s*([^\n]+)/gi);
    if (strongMatches) {
      for (const m of strongMatches) {
        const cleaned = m.replace(/^Strongest point:\s*/i, '').trim();
        if (cleaned && cleaned.length > 10 && !reasons.includes(cleaned)) {
          reasons.push(cleaned);
        }
      }
    }
  }

  return reasons.slice(0, 4);
}

/**
 * Build model scores from parsed critique data.
 * Uses weighted formula: accuracy * 0.5 + reasoning * 0.3 + completeness * 0.2
 */
function buildModelScores(
  scoreMap: Map<string, { accuracy: number[]; reasoning: number[]; completeness: number[] }>,
  round1Providers: string[]
): ModelScore[] {
  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 5;

  const modelScores: ModelScore[] = [];

  for (const provider of round1Providers) {
    const data = scoreMap.get(provider);
    const accuracy = data ? avg(data.accuracy) : 5;
    const reasoning = data ? avg(data.reasoning) : 5;
    const completeness = data ? avg(data.completeness) : 5;
    const finalScore = accuracy * 0.5 + reasoning * 0.3 + completeness * 0.2;

    modelScores.push({
      provider,
      displayName: PROVIDERS[provider]?.displayName ?? provider,
      accuracy: Math.round(accuracy * 10) / 10,
      reasoning: Math.round(reasoning * 10) / 10,
      completeness: Math.round(completeness * 10) / 10,
      finalScore: Math.round(finalScore * 10) / 10,
    });
  }

  // Sort by final score descending
  modelScores.sort((a, b) => b.finalScore - a.finalScore);
  return modelScores;
}

/**
 * Calculate confidence using agreement % and score variance.
 * confidence = (agreement_score * 0.6) + ((1 - score_variance) * 0.4)
 */
export function analyzeConfidence(rounds: Round[]): ConfidenceInfo {
  const round1 = rounds[0];
  const totalModels = round1.responses.length;

  if (totalModels <= 1) {
    return {
      level: 'medium',
      confidenceScore: 0.5,
      agreementCount: 1,
      totalModels: 1,
      disagreements: [],
      modelScores: [],
      keyDisagreements: [],
      whyThisAnswer: [],
    };
  }

  // If we have critique rounds, use structured scoring
  const critiqueRound = rounds.length > 1 ? rounds[rounds.length - 1] : null;
  const round1Providers = round1.responses.map((r) => r.provider);

  let modelScores: ModelScore[] = [];
  let disagreements: string[] = [];
  let whyReasons: string[] = [];

  if (critiqueRound) {
    const scoreMap = parseCritiqueScores(critiqueRound);
    modelScores = buildModelScores(scoreMap, round1Providers);
    disagreements = extractDisagreements(critiqueRound);
    whyReasons = extractWhyReasons(critiqueRound);
  }

  // Calculate agreement score
  // If models have similar scores (within 2 points), they "agree"
  let agreementCount = totalModels;
  if (modelScores.length >= 2) {
    const topScore = modelScores[0].finalScore;
    agreementCount = modelScores.filter((s) => Math.abs(s.finalScore - topScore) <= 2).length;
  }

  const agreementScore = agreementCount / totalModels;

  // Calculate score variance (normalized 0-1)
  let scoreVariance = 0;
  if (modelScores.length >= 2) {
    const scores = modelScores.map((s) => s.finalScore);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, s) => a + (s - mean) ** 2, 0) / scores.length;
    scoreVariance = Math.min(variance / 10, 1); // normalize to 0-1
  }

  // confidence = (agreement * 0.6) + ((1 - variance) * 0.4)
  const confidenceScore = Math.round((agreementScore * 0.6 + (1 - scoreVariance) * 0.4) * 100) / 100;

  let level: 'high' | 'medium' | 'low';
  if (confidenceScore >= 0.75) {
    level = 'high';
  } else if (confidenceScore >= 0.5) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return {
    level,
    confidenceScore,
    agreementCount,
    totalModels,
    disagreements: disagreements.slice(0, 3),
    modelScores,
    keyDisagreements: disagreements,
    whyThisAnswer: whyReasons,
  };
}

/**
 * Generate the final answer using GPT-4o as the JUDGE model.
 * Now receives critique data to make better decisions.
 */
export async function synthesizeConsensus(
  question: string,
  rounds: Round[],
  userApiKeys?: UserApiKeys,
  history?: { role: string; content: string }[]
): Promise<string> {
  // Collect critique text if available
  let critiqueData: string | undefined;
  if (rounds.length > 1) {
    critiqueData = rounds
      .slice(1)
      .flatMap((r) => r.responses)
      .map((r) => {
        const name = PROVIDERS[r.provider]?.displayName ?? r.provider;
        return `### ${name}'s Critique:\n${r.content}`;
      })
      .join('\n\n');
  }

  const prompt = getSynthesisPrompt(question, rounds, critiqueData, history);

  // GPT-4o judges first (strongest model), then Gemini, then Groq
  const judges = ['openai', 'gemini', 'groq'] as const;

  for (const judge of judges) {
    try {
      return await callProvider(judge, prompt, userApiKeys);
    } catch {
      continue;
    }
  }

  // Fallback: combine last round's responses
  const lastRound = rounds[rounds.length - 1];
  return lastRound.responses
    .map((r) => r.content)
    .join('\n\n');
}
