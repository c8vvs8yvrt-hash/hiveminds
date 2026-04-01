'use client';

import { Discussion } from '@/types';
import AIAvatar from './AIAvatar';

interface RoundtableViewProps {
  discussion: Discussion;
}

export default function RoundtableView({ discussion }: RoundtableViewProps) {
  return (
    <div className="space-y-6">
      {discussion.rounds.map((round) => (
        <div key={round.number}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-zinc-700" />
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Round {round.number}
            </span>
            <div className="h-px flex-1 bg-zinc-700" />
          </div>

          <div className="space-y-3">
            {round.responses.map((response, i) => (
              <div
                key={`${round.number}-${response.provider}-${i}`}
                className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50 hover:border-zinc-600/50 transition-colors"
              >
                <div className="mb-2">
                  <AIAvatar provider={response.provider} size="sm" />
                </div>
                <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {response.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {discussion.status === 'discussing' && (
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="animate-pulse flex gap-1">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '600ms' }} />
          </div>
          <span className="text-zinc-400 text-sm">AIs are discussing...</span>
        </div>
      )}

      {discussion.convergedAtRound && (
        <div className="text-center py-3">
          <span className="inline-flex items-center gap-2 text-sm text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-full">
            ✅ Consensus reached after {discussion.convergedAtRound} round{discussion.convergedAtRound > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
