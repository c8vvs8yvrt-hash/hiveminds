import { ProviderName, AIResponse, Round, UserApiKeys } from '@/types';
import { MIN_PROVIDERS_FOR_DISCUSSION } from './constants';
import { callAllProviders, callProvider, getAvailableProviders } from './providers';
import { getInitialPrompt } from './prompts';
import { synthesizeConsensus } from './synthesize';
import { getDemoConsensus, getDemoResponse } from './providers/demo';
import { isSimpleQuestion } from './complexity';

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
 * Fast path: single AI answers a simple question directly.
 */
async function runQuickAnswer(
  question: string,
  callbacks: RoundtableCallbacks,
  userApiKeys?: UserApiKeys
): Promise<void> {
  try {
    callbacks.onRoundStart(1);

    // Use Groq (fastest) for quick answers
    const content = await callProvider(
      'groq',
      `Answer this question directly and concisely: "${question}"`,
      userApiKeys
    );

    const response: AIResponse = {
      provider: 'groq' as ProviderName,
      content,
      round: 1,
      timestamp: Date.now(),
    };
    callbacks.onAIResponse(response);
    callbacks.onConvergence(true, 1);
    callbacks.onConsensus(content);
  } catch (error) {
    // If quick answer fails, fall back to full roundtable
    console.log('[HiveMinds] Quick answer failed, using full roundtable');
    return runFullRoundtable(question, callbacks, userApiKeys);
  }

  callbacks.onDone();
}

/**
 * Full roundtable: all providers answer in parallel, then synthesize.
 */
async function runFullRoundtable(
  question: string,
  callbacks: RoundtableCallbacks,
  userApiKeys?: UserApiKeys,
  isPaid: boolean = false
): Promise<void> {
  const providers = getAvailableProviders(userApiKeys, isPaid);

  if (providers.length < MIN_PROVIDERS_FOR_DISCUSSION) {
    return runDemoRoundtable(question, callbacks);
  }

  try {
    callbacks.onRoundStart(1);

    const round1Responses = await callAllProviders(
      providers,
      (provider) => getInitialPrompt(provider, question),
      1,
      userApiKeys,
      callbacks.onAIResponse
    );

    if (round1Responses.length < MIN_PROVIDERS_FOR_DISCUSSION) {
      return runDemoRoundtable(question, callbacks);
    }

    const allRounds: Round[] = [{ number: 1, responses: round1Responses }];

    callbacks.onConvergence(true, 1);

    let consensus: string;
    try {
      consensus = await synthesizeConsensus(question, allRounds, userApiKeys);
    } catch {
      consensus = allRounds[0].responses.map((r) => r.content).join('\n\n');
    }

    callbacks.onConsensus(consensus);
  } catch (error) {
    callbacks.onError(
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
  }

  callbacks.onDone();
}

/**
 * Main entry point: routes to quick answer or full roundtable based on complexity.
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
    return runDemoRoundtable(question, callbacks);
  }

  // Smart routing: simple questions get instant answers
  if (isSimpleQuestion(question)) {
    console.log('[HiveMinds] Simple question detected, using quick answer');
    return runQuickAnswer(question, callbacks, userApiKeys);
  }

  console.log('[HiveMinds] Complex question, using full roundtable');
  return runFullRoundtable(question, callbacks, userApiKeys, isPaid);
}
