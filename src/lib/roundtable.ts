import { ProviderName, AIResponse, Round, UserApiKeys, DiscussionMode } from '@/types';
import { MODE_CONFIG, MIN_PROVIDERS_FOR_DISCUSSION } from './constants';
import { callAllProviders, callProvider, getAvailableProviders } from './providers';
import { getInitialPrompt, getDiscussionPrompt } from './prompts';
import { synthesizeConsensus } from './synthesize';
import { checkConvergence } from './convergence';
import { getDemoConsensus, getDemoResponse } from './providers/demo';

export interface RoundtableCallbacks {
  onRoundStart: (round: number) => void;
  onAIResponse: (response: AIResponse) => void;
  onConvergence: (agreed: boolean, round: number) => void;
  onConsensus: (content: string) => void;
  onError: (error: string) => void;
  onDone: () => void;
}

async function runDemoRoundtable(
  question: string,
  callbacks: RoundtableCallbacks
): Promise<void> {
  const providers: ProviderName[] = ['gemini', 'groq', 'mistral'];
  try {
    callbacks.onRoundStart(1);
    for (const provider of providers) {
      const content = await getDemoResponse(provider, 1, question);
      callbacks.onAIResponse({ provider, content, round: 1, timestamp: Date.now() });
    }
    callbacks.onConvergence(true, 1);
    await new Promise((resolve) => setTimeout(resolve, 800));
    callbacks.onConsensus(getDemoConsensus(question));
  } catch (error) {
    callbacks.onError(error instanceof Error ? error.message : 'Demo error');
  }
  callbacks.onDone();
}

export async function runRoundtable(
  question: string,
  callbacks: RoundtableCallbacks,
  options: {
    userApiKeys?: UserApiKeys;
    isPaid?: boolean;
    mode?: DiscussionMode;
    images?: { data: string; mimeType: string }[];
  } = {}
): Promise<void> {
  const { userApiKeys, isPaid = false, mode = 'instant', images } = options;
  const config = MODE_CONFIG[mode];

  // Filter to available providers from the mode's list
  const allAvailable = getAvailableProviders(userApiKeys, isPaid);
  const providers = config.providers.filter((p) => allAvailable.includes(p));

  console.log(`[HiveMinds] Mode: ${mode} | Providers: ${providers.join(', ')} | Max rounds: ${config.maxRounds}`);

  if (providers.length < MIN_PROVIDERS_FOR_DISCUSSION) {
    return runDemoRoundtable(question, callbacks);
  }

  try {
    // === ROUND 1: All providers answer in parallel ===
    callbacks.onRoundStart(1);
    const round1Responses = await callAllProviders(
      providers,
      (provider) => getInitialPrompt(provider, question),
      1,
      userApiKeys,
      callbacks.onAIResponse,
      false,
      images
    );

    if (round1Responses.length < MIN_PROVIDERS_FOR_DISCUSSION) {
      return runDemoRoundtable(question, callbacks);
    }

    const allRounds: Round[] = [{ number: 1, responses: round1Responses }];

    // === INSTANT MODE: skip multi-round, go straight to synthesis ===
    if (mode === 'instant') {
      callbacks.onConvergence(true, 1);
      let consensus: string;
      try {
        consensus = await synthesizeConsensus(question, allRounds, userApiKeys);
      } catch {
        consensus = round1Responses.map((r) => r.content).join('\n\n');
      }
      callbacks.onConsensus(consensus);
      callbacks.onDone();
      return;
    }

    // === THINKING/DEEP: Multi-round discussion ===
    for (let roundNum = 2; roundNum <= config.maxRounds; roundNum++) {
      const lastRound = allRounds[allRounds.length - 1];

      // Check convergence
      let converged = false;
      try {
        converged = await checkConvergence(question, lastRound.responses, userApiKeys);
      } catch {
        converged = allRounds.length >= 2;
      }

      callbacks.onConvergence(converged, roundNum - 1);
      if (converged) break;

      // Next discussion round
      callbacks.onRoundStart(roundNum);
      const roundResponses = await callAllProviders(
        providers,
        (provider) => getDiscussionPrompt(provider, question, lastRound.responses, roundNum),
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
      const lastRound = allRounds[allRounds.length - 1];
      consensus = lastRound.responses.map((r) => r.content).join('\n\n');
    }

    callbacks.onConsensus(consensus);
  } catch (error) {
    callbacks.onError(error instanceof Error ? error.message : 'An unexpected error occurred');
  }

  callbacks.onDone();
}
