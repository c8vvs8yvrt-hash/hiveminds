'use client';

import { PROVIDERS } from '@/lib/constants';
import { ProviderName } from '@/types';

interface AIAvatarProps {
  provider: ProviderName;
  size?: 'sm' | 'md' | 'lg';
}

const PROVIDER_ICONS: Record<ProviderName, string> = {
  gemini: '🔵',
  groq: '🦙',
  mistral: '🌬️',
  cohere: '🧠',
  openrouter: '🔮',
  openai: '🤖',
};

export default function AIAvatar({ provider, size = 'md' }: AIAvatarProps) {
  const config = PROVIDERS[provider];
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center`}
        style={{ backgroundColor: config?.color + '20', border: `2px solid ${config?.color}` }}
      >
        <span>{PROVIDER_ICONS[provider]}</span>
      </div>
      <span
        className="font-semibold text-sm"
        style={{ color: config?.color }}
      >
        {config?.displayName ?? provider}
      </span>
    </div>
  );
}
