'use client';

import { useState } from 'react';
import { Discussion } from '@/types';
import RoundtableView from './RoundtableView';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

interface ConsensusMessageProps {
  discussion: Discussion;
}

export default function ConsensusMessage({ discussion }: ConsensusMessageProps) {
  const [showRoundtable, setShowRoundtable] = useState(false);

  const totalResponses = discussion.rounds.reduce(
    (sum, r) => sum + r.responses.length,
    0
  );

  const isDebating = !discussion.consensus && discussion.status !== 'error';

  return (
    <div className="space-y-2">
      {/* Show live debate while AIs are discussing */}
      {isDebating && discussion.rounds.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={14} className="text-amber-400" />
            <span className="text-xs font-medium text-amber-400">
              Live Debate — Round {discussion.rounds.length}
            </span>
          </div>
          <div className="border-l-2 border-amber-500/30 pl-3">
            <RoundtableView discussion={discussion} compact />
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isDebating && (
        <div className="flex items-center gap-3 py-2">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-zinc-500 text-xs">
            {discussion.status === 'discussing'
              ? `AIs are debating...`
              : 'Synthesizing final answer...'}
          </span>
        </div>
      )}

      {/* Final consensus answer */}
      {discussion.consensus && (
        <div className="text-zinc-200 text-sm leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-2 prose-li:my-0.5 prose-ol:my-2 prose-ul:my-2 prose-strong:text-zinc-100 prose-headings:text-zinc-100">
          <ReactMarkdown>{discussion.consensus}</ReactMarkdown>
        </div>
      )}

      {/* Toggle roundtable view after consensus */}
      {discussion.rounds.length > 0 && discussion.consensus && (
        <button
          onClick={() => setShowRoundtable(!showRoundtable)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-2"
        >
          <MessageSquare size={12} />
          <span>
            {showRoundtable ? 'Hide' : 'View'} AI debate
          </span>
          <span className="text-zinc-600">
            ({totalResponses} messages, {discussion.rounds.length} round{discussion.rounds.length > 1 ? 's' : ''})
          </span>
          {showRoundtable ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      )}

      {showRoundtable && (
        <div className="mt-3 ml-1 pl-3 border-l-2 border-zinc-700">
          <RoundtableView discussion={discussion} />
        </div>
      )}
    </div>
  );
}
