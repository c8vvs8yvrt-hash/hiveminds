import { ProviderName, AIResponse, Round, UserApiKeys } from '@/types';
import { MIN_PROVIDERS_FOR_DISCUSSION } from './constants';
import { callAllProviders, getAvailableProviders } from './providers';
import { getInitialPrompt } from './prompts';
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

/**
 * Orchestrate a fast single-round discussion.
 * All providers answer in parallel, then Groq synthesizes.
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

  const providers = getAvailableProviders(userApiKeys, isPaid);
  console.log('[HiveMinds] Available providers:', providers, '| isPaid:', isPaid);

  if (providers.length < MIN_PROVIDERS_FOR_DISCUSSION) {
    console.log('[HiveMinds] Not enough providers, using demo mode');
    return runDemoRoundtable(question, callbacks);
  }

  try {
    // === SINGLE ROUND: All providers answer in parallel with timeout ===
    callbacks.onRoundStart(1);

    const round1Responses = await callAllProviders(
      providers,
      (provider) => getInitialPrompt(provider, question),
      1,
      userApiKeys,
      callbacks.onAIResponse
    );

    if (round1Responses.length < MIN_PROVIDERS_FOR_DISCUSSION) {
      console.log('[HiveMinds] Round 1 failed, switching to demo mode');
      return runDemoRoundtable(question, callbacks);
    }

    const allRounds: Round[] = [{ number: 1, responses: round1Responses }];

    // === SYNTHESIZE immediately — no convergence check needed for 1 round ===
    callbacks.onConvergence(true, 1);

    let consensus: string;
    try {
      consensus = await synthesizeConsensus(question, allRounds, userApiKeys);
    } catch {
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
