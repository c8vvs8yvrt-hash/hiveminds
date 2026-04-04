'use client';

import { useState } from 'react';
import { Discussion } from '@/types';
import RoundtableView from './RoundtableView';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, ChevronUp, MessageSquare, CheckCircle2, AlertTriangle, AlertCircle, BarChart3, Globe, ExternalLink, Shield } from 'lucide-react';

interface ConsensusMessageProps {
  discussion: Discussion;
}

export default function ConsensusMessage({ discussion }: ConsensusMessageProps) {
  const [showRoundtable, setShowRoundtable] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const totalResponses = discussion.rounds.reduce(
    (sum, r) => sum + r.responses.length,
    0
  );

  const isDebating = !discussion.consensus && discussion.status !== 'error';
  const confidence = discussion.confidence;

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

      {/* Confidence + Reasoning panel */}
      {discussion.consensus && confidence && (
        <div className="mt-3 space-y-2">
          {/* Confidence badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
              confidence.level === 'high'
                ? 'bg-emerald-500/10 text-emerald-400'
                : confidence.level === 'medium'
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-red-500/10 text-red-400'
            }`}>
              {confidence.level === 'high' ? (
                <CheckCircle2 size={12} />
              ) : confidence.level === 'medium' ? (
                <AlertTriangle size={12} />
              ) : (
                <AlertCircle size={12} />
              )}
              <span className="font-medium capitalize">{confidence.level} confidence</span>
              <span className="opacity-60">
                {confidence.confidenceScore > 0 && `(${Math.round(confidence.confidenceScore * 100)}%)`}
              </span>
            </div>

            <span className="text-[11px] text-zinc-500">
              {confidence.agreementCount}/{confidence.totalModels} models agreed
            </span>
          </div>

          {/* Why this answer */}
          {confidence.whyThisAnswer && confidence.whyThisAnswer.length > 0 && (
            <div className="text-[11px] text-zinc-400">
              <span className="text-zinc-500 font-medium">Why this answer: </span>
              {confidence.whyThisAnswer.slice(0, 2).join(' • ')}
            </div>
          )}

          {/* Key disagreements */}
          {confidence.keyDisagreements && confidence.keyDisagreements.length > 0 && (
            <div className="space-y-0.5">
              <span className="text-[11px] text-zinc-500 font-medium">Key disagreements:</span>
              {confidence.keyDisagreements.slice(0, 3).map((d, i) => (
                <p key={i} className="text-[11px] text-zinc-500 pl-2">
                  • {d}
                </p>
              ))}
            </div>
          )}

          {/* Model scores toggle */}
          {confidence.modelScores && confidence.modelScores.length > 0 && (
            <>
              <button
                onClick={() => setShowScores(!showScores)}
                className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <BarChart3 size={11} />
                <span>{showScores ? 'Hide' : 'Show'} model scores</span>
                {showScores ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>

              {showScores && (
                <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
                  <div className="space-y-2">
                    {confidence.modelScores.map((model) => (
                      <div key={model.provider} className="flex items-center gap-3">
                        <span className="text-[11px] text-zinc-300 w-16 truncate font-medium">
                          {model.displayName}
                        </span>
                        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              model.finalScore >= 7 ? 'bg-emerald-500' :
                              model.finalScore >= 5 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${(model.finalScore / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-zinc-400 w-8 text-right font-mono">
                          {model.finalScore}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-zinc-800/50 flex gap-4 text-[10px] text-zinc-600">
                    <span>Accuracy 50%</span>
                    <span>Reasoning 30%</span>
                    <span>Completeness 20%</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Sources */}
      {discussion.consensus && discussion.sources && discussion.sources.length > 0 && (
        <>
          <button
            onClick={() => setShowSources(!showSources)}
            className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <Globe size={11} />
            <span>{showSources ? 'Hide' : 'Show'} sources ({discussion.sources.length})</span>
            {showSources ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>

          {showSources && (
            <div className="space-y-1.5 mt-1">
              {discussion.sources.map((source, i) => (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors group"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {source.tier === 1 ? (
                      <Shield size={12} className="text-emerald-400" />
                    ) : source.tier === 2 ? (
                      <Globe size={12} className="text-blue-400" />
                    ) : (
                      <Globe size={12} className="text-zinc-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-zinc-300 truncate font-medium group-hover:text-zinc-100">
                        {source.title}
                      </span>
                      <ExternalLink size={9} className="text-zinc-600 flex-shrink-0" />
                    </div>
                    <span className={`text-[9px] font-medium ${
                      source.tier === 1 ? 'text-emerald-500' :
                      source.tier === 2 ? 'text-blue-500' : 'text-zinc-600'
                    }`}>
                      {source.tierLabel}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </>
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
