'use client';

import { useState } from 'react';
import { Discussion } from '@/types';
import RoundtableView from './RoundtableView';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ConsensusMessageProps {
  discussion: Discussion;
}

export default function ConsensusMessage({ discussion }: ConsensusMessageProps) {
  const [showRoundtable, setShowRoundtable] = useState(false);

  const totalResponses = discussion.rounds.reduce(
    (sum, r) => sum + r.responses.length,
    0
  );

  return (
    <div className="space-y-2">
      {/* Consensus answer with markdown rendering */}
      {discussion.consensus && (
        <div className="text-zinc-200 text-sm leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-2 prose-li:my-0.5 prose-ol:my-2 prose-ul:my-2 prose-strong:text-zinc-100 prose-headings:text-zinc-100">
          <ReactMarkdown>{discussion.consensus}</ReactMarkdown>
        </div>
      )}

      {/* Loading state */}
      {!discussion.consensus && discussion.status !== 'error' && (
        <div className="flex items-center gap-3 py-2">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-zinc-500 text-xs">
            {discussion.status === 'discussing'
              ? `Round ${discussion.rounds.length} — thinking...`
              : 'Finalizing...'}
          </span>
        </div>
      )}

      {/* Toggle roundtable view */}
      {discussion.rounds.length > 0 && discussion.consensus && (
        <button
          onClick={() => setShowRoundtable(!showRoundtable)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-2"
        >
          <span>
            {showRoundtable ? 'Hide' : 'Show'} AI discussion
          </span>
          <span className="text-zinc-600">
            ({totalResponses} messages, {discussion.rounds.length} round{discussion.rounds.length > 1 ? 's' : ''})
          </span>
          {showRoundtable ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      )}

      {showRoundtable && (
        <div className="mt-3 ml-1 pl-3 border-l border-zinc-800">
          <RoundtableView discussion={discussion} />
        </div>
      )}
    </div>
  );
}
