import { ProviderName, AIResponse, Round, UserApiKeys } from '@/types';
import { MAX_ROUNDS, MIN_PROVIDERS_FOR_DISCUSSION } from './constants';
import { callAllProviders, getAvailableProviders } from './providers';
import { getInitialPrompt, getDiscussionPrompt } from './prompts';
import { checkConvergence } from './convergence';
import { synthesizeConsensus } from './synthesize';
import { getDemoConsensus, getDemoResponse } from './providers/demo';

export interface RoundtableCallbacks {
  onRoundStart: (round: number) => void;
  onAIResponse: (response: AIResponse) => void;
  onConvergence: (agreed: boolean, round: number) => void;
  onConsensus: (content: string) => void;
  onError: (error: string) => void;
  onDone: () => void;
}

/**
 * Run the full roundtable in demo mode (no API keys needed).
 */
async function runDemoRoundtable(
  question: string,
  callbacks: RoundtableCallbacks
): Promise<void> {
  const providers: ProviderName[] = ['gemini', 'groq', 'mistral'];

  try {
    // Round 1
    callbacks.onRoundStart(1);
    for (const provider of providers) {
      const content = await getDemoResponse(provider, 1, question);
      callbacks.onAIResponse({ provider, content, round: 1, timestamp: Date.now() });
    }

    // Round 2
    callbacks.onRoundStart(2);
    for (const provider of providers) {
      const content = await getDemoResponse(provider, 2, question);
      callbacks.onAIResponse({ provider, content, round: 2, timestamp: Date.now() });
    }

    // Converged
    callbacks.onConvergence(true, 2);

    // Synthesis
    await new Promise((resolve) => setTimeout(resolve, 1200));
    callbacks.onConsensus(getDemoConsensus(question));
  } catch (error) {
    callbacks.onError(error instanceof Error ? error.message : 'Demo error');
  }

  callbacks.onDone();
}

/**
 * Orchestrate a full roundtable discussion.
 * Falls back to demo mode if real providers aren't available or all fail.
 */
export async function runRoundtable(
  question: string,
  callbacks: RoundtableCallbacks,
  options: {
    userApiKeys?: UserApiKeys;
    isPaid?: boolean;
  } = {}
): Promise<void> {
  const { userApiKeys, isPaid = false } = options;

  // Determine available providers
  const providers = getAvailableProviders(userApiKeys, isPaid);
  console.log('[HiveMinds] Available providers:', providers, '| isPaid:', isPaid);

  if (providers.length < MIN_PROVIDERS_FOR_DISCUSSION) {
    console.log('[HiveMinds] Not enough providers, using demo mode');
    return runDemoRoundtable(question, callbacks);
  }

  const allRounds: Round[] = [];

  try {
    // === ROUND 1: Independent answers ===
    callbacks.onRoundStart(1);

    const round1Responses = await callAllProviders(
      providers,
      (provider) => getInitialPrompt(provider, question),
      1,
      userApiKeys,
      callbacks.onAIResponse
    );

    // If all real providers failed, switch to demo mode
    if (round1Responses.length < MIN_PROVIDERS_FOR_DISCUSSION) {
      console.log('[HiveMinds] Round 1 failed, switching to demo mode');
      return runDemoRoundtable(question, callbacks);
    }

    allRounds.push({ number: 1, responses: round1Responses });

    // === ROUNDS 2+: Discussion until convergence ===
    for (let roundNum = 2; roundNum <= MAX_ROUNDS; roundNum++) {
      const lastRound = allRounds[allRounds.length - 1];

      // Check convergence
      let converged = false;
      try {
        converged = await checkConvergence(question, lastRound.responses, userApiKeys);
      } catch {
        converged = allRounds.length >= 2; // Assume converged after 2+ rounds if check fails
      }

      callbacks.onConvergence(converged, roundNum - 1);
      if (converged) break;

      // Next discussion round
      callbacks.onRoundStart(roundNum);

      const previousResponses = lastRound.responses;
      const roundResponses = await callAllProviders(
        providers,
        (provider) =>
          getDiscussionPrompt(provider, question, previousResponses, roundNum),
        roundNum,
        userApiKeys,
        callbacks.onAIResponse
      );

      if (roundResponses.length > 0) {
        allRounds.push({ number: roundNum, responses: roundResponses });
      }
    }

    // === FINAL SYNTHESIS ===
    let consensus: string;
    try {
      consensus = await synthesizeConsensus(question, allRounds, userApiKeys);
    } catch {
      // Fallback: combine last round
      const lastRound = allRounds[allRounds.length - 1];
      consensus = lastRound.responses.map((r) => r.content).join('\n\n');
    }

    callbacks.onConsensus(consensus);
  } catch (error) {
    callbacks.onError(
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
  }

  callbacks.onDone();
}
