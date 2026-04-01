'use client';

import { Discussion } from '@/types';
import { PROVIDERS } from '@/lib/constants';
import { ProviderName } from '@/types';
import ReactMarkdown from 'react-markdown';

const PROVIDER_ICONS: Record<ProviderName, string> = {
  gemini: '🔵',
  groq: '🦙',
  mistral: '🌬️',
  cohere: '🧠',
  openrouter: '🔮',
  openai: '🤖',
};

interface RoundtableViewProps {
  discussion: Discussion;
  compact?: boolean;
}

export default function RoundtableView({ discussion, compact }: RoundtableViewProps) {
  return (
    <div className="space-y-4">
      {discussion.rounds.map((round) => (
        <div key={round.number}>
          {!compact && (
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-zinc-800" />
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
                Round {round.number}
              </span>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>
          )}

          <div className="space-y-2">
            {round.responses.map((response, i) => {
              const config = PROVIDERS[response.provider];
              const icon = PROVIDER_ICONS[response.provider] || '💭';
              const name = config?.displayName ?? response.provider;
              const color = config?.color ?? '#888';

              return (
                <div
                  key={`${round.number}-${response.provider}-${i}`}
                  className="group flex gap-2.5 py-2 px-3 rounded-lg hover:bg-zinc-800/30 transition-colors"
                >
                  {/* Avatar */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs"
                    style={{ backgroundColor: color + '20', border: `1.5px solid ${color}` }}
                  >
                    {icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold" style={{ color }}>
                      {name}
                    </span>
                    <div className="text-zinc-300 text-sm leading-relaxed mt-0.5 prose prose-invert prose-sm max-w-none prose-p:my-1 prose-p:text-sm">
                      <ReactMarkdown>{response.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {discussion.status === 'discussing' && (
        <div className="flex items-center gap-2 py-2 px-3">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-zinc-500 text-xs">More AIs responding...</span>
        </div>
      )}

      {!compact && discussion.convergedAtRound && (
        <div className="text-center py-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full">
            Consensus reached in {discussion.convergedAtRound} round{discussion.convergedAtRound > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
