'use client';

import { useState } from 'react';
import { Discussion } from '@/types';
import RoundtableView from './RoundtableView';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, ChevronUp, MessageSquare, CheckCircle2, AlertTriangle, AlertCircle, BarChart3, Globe, ExternalLink, Shield, Eye, EyeOff } from 'lucide-react';

interface ConsensusMessageProps {
  discussion: Discussion;
  cleanMode?: boolean;
}

export default function ConsensusMessage({ discussion, cleanMode = false }: ConsensusMessageProps) {
  const [showRoundtable, setShowRoundtable] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [showLiveDebate, setShowLiveDebate] = useState(true);

  const totalResponses = discussion.rounds.reduce(
    (sum, r) => sum + r.responses.length,
    0
  );

  const isDebating = !discussion.consensus && discussion.status !== 'error';
  const confidence = discussion.confidence;
  const modelCount = confidence?.totalModels || discussion.rounds[0]?.responses.length || 0;

  return (
    <div className="space-y-2">
      {/* Show live debate while AIs are discussing */}
      {isDebating && discussion.rounds.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowLiveDebate(!showLiveDebate)}
            className="flex items-center gap-2 mb-2"
          >
            <MessageSquare size={14} className="text-amber-400" />
            <span className="text-xs font-medium text-amber-400">
              Live Debate — Round {discussion.rounds.length}
            </span>
            {showLiveDebate ? (
              <EyeOff size={12} className="text-zinc-500 hover:text-zinc-300" />
            ) : (
              <Eye size={12} className="text-zinc-500 hover:text-zinc-300" />
            )}
          </button>
          {showLiveDebate && (
            <div className="border-l-2 border-amber-500/30 pl-3">
              <RoundtableView discussion={discussion} compact />
            </div>
          )}
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

      {/* === VERIFICATION HEADER (shown ABOVE the answer) === */}
      {discussion.consensus && !cleanMode && (
        <div className="flex items-center gap-3 flex-wrap pb-2 mb-1 border-b border-zinc-800/50">
          {/* Verified badge */}
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <CheckCircle2 size={13} />
            <span className="font-medium">Verified by {modelCount} AI models</span>
          </div>

          {/* Confidence pill */}
          {confidence && (
            <div className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
              confidence.level === 'high'
                ? 'bg-emerald-500/10 text-emerald-400'
                : confidence.level === 'medium'
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-red-500/10 text-red-400'
            }`}>
              {confidence.level === 'high' ? (
                <CheckCircle2 size={10} />
              ) : confidence.level === 'medium' ? (
                <AlertTriangle size={10} />
              ) : (
                <AlertCircle size={10} />
              )}
              <span className="font-medium capitalize">{confidence.level} confidence</span>
            </div>
          )}

          {/* Source count */}
          {discussion.sources && discussion.sources.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-blue-400">
              <Globe size={11} />
              <span>{discussion.sources.length} sources</span>
            </div>
          )}
        </div>
      )}

      {/* === DISAGREEMENT SUMMARY (compact, visible by default) === */}
      {discussion.consensus && !cleanMode && confidence && (
        <>
          {confidence.keyDisagreements && confidence.keyDisagreements.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2 mb-2">
              <span className="text-[11px] font-medium text-amber-400">Key disagreement: </span>
              <span className="text-[11px] text-zinc-400">
                {confidence.keyDisagreements[0]}
              </span>
            </div>
          )}
        </>
      )}

      {/* Final consensus answer */}
      {discussion.consensus && (
        <div className="text-zinc-200 text-sm leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-2 prose-li:my-0.5 prose-ol:my-2 prose-ul:my-2 prose-strong:text-zinc-100 prose-headings:text-zinc-100">
          <ReactMarkdown>{discussion.consensus}</ReactMarkdown>
        </div>
      )}

      {/* Everything below: expandable details */}
      {!cleanMode && discussion.consensus && (
        <div className="mt-3 pt-2 border-t border-zinc-800/30 space-y-2">
          {/* Why this answer + more disagreements */}
          {confidence && (
            <>
              {confidence.whyThisAnswer && confidence.whyThisAnswer.length > 0 && (
                <div className="text-[11px] text-zinc-400">
                  <span className="text-zinc-500 font-medium">Why this answer: </span>
                  {confidence.whyThisAnswer.slice(0, 2).join(' • ')}
                </div>
              )}

              {confidence.keyDisagreements && confidence.keyDisagreements.length > 1 && (
                <div className="space-y-0.5">
                  <span className="text-[11px] text-zinc-500 font-medium">Other disagreements:</span>
                  {confidence.keyDisagreements.slice(1, 3).map((d, i) => (
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
            </>
          )}

          {/* Sources */}
          {discussion.sources && discussion.sources.length > 0 && (
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

          {/* Toggle roundtable view */}
          {discussion.rounds.length > 0 && (
            <button
              onClick={() => setShowRoundtable(!showRoundtable)}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
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
      )}
    </div>
  );
}
