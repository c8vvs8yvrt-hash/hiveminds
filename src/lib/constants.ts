import { ProviderConfig, Tier } from '@/types';

export const PROVIDERS: Record<string, ProviderConfig> = {
  gemini: {
    name: 'gemini',
    displayName: 'Gemini',
    color: '#4285F4',
    emoji: '🔵',
    model: 'gemini-2.5-flash',
  },
  groq: {
    name: 'groq',
    displayName: 'Llama',
    color: '#F97316',
    emoji: '🦙',
    model: 'llama-3.3-70b-versatile',
  },
  mistral: {
    name: 'mistral',
    displayName: 'Mistral',
    color: '#FF7000',
    emoji: '🌬️',
    model: 'mistral-small-latest',
  },
  cohere: {
    name: 'cohere',
    displayName: 'Cohere',
    color: '#39594D',
    emoji: '🧠',
    model: 'command-a-03-2025',
  },
  openrouter: {
    name: 'openrouter',
    displayName: 'Qwen',
    color: '#5B6CF0',
    emoji: '🔮',
    model: 'qwen/qwen3.6-plus-preview:free',
  },
};

export const TIER_LIMITS: Record<Tier, { daily?: number; monthly?: number }> = {
  FREE: { daily: 5 },
  PRO: { monthly: 200 },
  MAX: { monthly: 750 },
};

export const PRICING = {
  FREE: { price: 0, label: 'Free', description: 'Bring your own API keys' },
  PRO: { price: 25, label: 'Pro', description: '200 discussions/month, all AIs included' },
  MAX: { price: 55, label: 'Max', description: '750 discussions/month, all AIs included' },
};

export const MAX_ROUNDS = 4;
export const MIN_PROVIDERS_FOR_DISCUSSION = 2;
