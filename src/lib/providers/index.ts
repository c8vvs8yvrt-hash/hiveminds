import { ProviderName, AIResponse, UserApiKeys } from '@/types';
import { callGemini } from './gemini';
import { callGroq } from './groq';
import { callMistral } from './mistral';
import { callCohere } from './cohere';
import { callOpenRouter } from './openrouter';
import { getDemoResponse } from './demo';

type ProviderFn = (prompt: string, apiKey?: string) => Promise<string>;

const PROVIDER_FUNCTIONS: Record<ProviderName, ProviderFn> = {
  gemini: callGemini,
  groq: callGroq,
  mistral: callMistral,
  cohere: callCohere,
  openrouter: callOpenRouter,
};

const ENV_KEY_MAP: Record<ProviderName, string> = {
  gemini: 'GEMINI_API_KEY',
  groq: 'GROQ_API_KEY',
  mistral: 'MISTRAL_API_KEY',
  cohere: 'COHERE_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
};

/**
 * Determines which providers are available based on API keys.
 */
export function getAvailableProviders(
  userApiKeys?: UserApiKeys,
  isPaid: boolean = false,
  demoMode: boolean = false
): ProviderName[] {
  if (demoMode) {
    return ['gemini', 'groq', 'mistral'] as ProviderName[];
  }

  const available: ProviderName[] = [];
  const allProviders: ProviderName[] = ['gemini', 'groq', 'mistral', 'cohere', 'openrouter'];

  for (const provider of allProviders) {
    const userKey = userApiKeys?.[provider as keyof UserApiKeys];

    if (userKey) {
      available.push(provider);
    } else if (isPaid || !userApiKeys) {
      // Check server env vars
      if (process.env[ENV_KEY_MAP[provider]]) {
        available.push(provider);
      }
    }
  }

  return available;
}

/**
 * Call a single provider
 */
export async function callProvider(
  provider: ProviderName,
  prompt: string,
  userApiKeys?: UserApiKeys
): Promise<string> {
  const fn = PROVIDER_FUNCTIONS[provider];
  const apiKey = userApiKeys?.[provider as keyof UserApiKeys];
  return fn(prompt, apiKey);
}

const PROVIDER_TIMEOUT_MS = 10000; // 10 second timeout per provider

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Call all available providers in parallel with timeout
 */
export async function callAllProviders(
  providers: ProviderName[],
  prompt: string | ((provider: ProviderName) => string),
  round: number,
  userApiKeys?: UserApiKeys,
  onResponse?: (response: AIResponse) => void,
  demoMode: boolean = false
): Promise<AIResponse[]> {
  const results = await Promise.allSettled(
    providers.map(async (provider) => {
      try {
        let content: string;
        if (demoMode) {
          const q = typeof prompt === 'function' ? prompt(provider) : prompt;
          content = await getDemoResponse(provider, round, q);
        } else {
          const p = typeof prompt === 'function' ? prompt(provider) : prompt;
          content = await withTimeout(
            callProvider(provider, p, userApiKeys),
            PROVIDER_TIMEOUT_MS,
            provider
          );
        }
        const response: AIResponse = {
          provider,
          content,
          round,
          timestamp: Date.now(),
        };
        onResponse?.(response);
        return response;
      } catch (err) {
        console.error(`[HiveMinds] Provider ${provider} failed:`, err instanceof Error ? err.message : err);
        throw err;
      }
    })
  );

  const successful = results
    .filter((r): r is PromiseFulfilledResult<AIResponse> => r.status === 'fulfilled')
    .map((r) => r.value);

  // If all real providers failed, fall back to demo
  if (successful.length === 0 && !demoMode) {
    console.log('[HiveMinds] All providers failed — falling back to demo mode');
    return callAllProviders(providers, prompt, round, userApiKeys, onResponse, true);
  }

  return successful;
}
