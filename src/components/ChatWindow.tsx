'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, Discussion, AIResponse, ProviderName, UserApiKeys, DiscussionMode, Attachment } from '@/types';
import ConsensusMessage from './ConsensusMessage';
import MessageInput from './MessageInput';
import ModeSelector from './ModeSelector';
import { Settings } from 'lucide-react';

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeys, setApiKeys] = useState<UserApiKeys>({});
  const [mode, setMode] = useState<DiscussionMode>('instant');
  const [autoSwitch, setAutoSwitch] = useState(true);
  const [upgradedPill, setUpgradedPill] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('hiveminds_apikeys');
    if (stored) {
      try { setApiKeys(JSON.parse(stored)); } catch { /* ignore */ }
    }
    const savedMode = localStorage.getItem('hiveminds_mode') as DiscussionMode | null;
    if (savedMode) setMode(savedMode);
    const savedAutoSwitch = localStorage.getItem('hiveminds_autoswitch');
    if (savedAutoSwitch !== null) setAutoSwitch(savedAutoSwitch === 'true');
  }, []);

  const handleModeChange = (newMode: DiscussionMode) => {
    setMode(newMode);
    localStorage.setItem('hiveminds_mode', newMode);
  };

  const handleAutoSwitchChange = (enabled: boolean) => {
    setAutoSwitch(enabled);
    localStorage.setItem('hiveminds_autoswitch', String(enabled));
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSend = async (message: string, attachments?: Attachment[]) => {
    setUpgradedPill(false);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      attachments,
      timestamp: Date.now(),
    };

    const discussion: Discussion = {
      id: crypto.randomUUID(),
      question: message,
      rounds: [],
      consensus: null,
      convergedAtRound: null,
      status: 'discussing',
    };

    const aiMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'hivemind',
      content: '',
      discussion,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setIsLoading(true);

    try {
      const hasUserKeys = Object.values(apiKeys).some((k) => k?.trim());

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          mode,
          autoSwitch,
          ...(hasUserKeys ? { apiKeys } : {}),
          ...(attachments ? { attachments } : {}),
        }),
      });

      if (!response.ok) throw new Error('Failed to start discussion');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (!reader) throw new Error('No response stream');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const eventStr of events) {
          if (!eventStr.trim()) continue;

          const lines = eventStr.split('\n');
          let eventType = '';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7);
            if (line.startsWith('data: ')) eventData = line.slice(6);
          }

          if (!eventType || !eventData) continue;

          const data = JSON.parse(eventData);

          // Handle mode event (auto-upgrade notification)
          if (eventType === 'mode') {
            if (data.wasUpgraded) {
              setUpgradedPill(true);
              setTimeout(() => setUpgradedPill(false), 4000);
            }
            continue;
          }

          setMessages((prev) => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg.role !== 'hivemind' || !lastMsg.discussion) return prev;

            const disc = { ...lastMsg.discussion };

            switch (eventType) {
              case 'round_start': {
                const roundNum = data.round as number;
                if (!disc.rounds.find((r) => r.number === roundNum)) {
                  disc.rounds = [...disc.rounds, { number: roundNum, responses: [] }];
                }
                disc.status = 'discussing';
                break;
              }
              case 'ai_response': {
                const resp: AIResponse = {
                  provider: data.provider as ProviderName,
                  content: data.content as string,
                  round: data.round as number,
                  timestamp: data.timestamp as number,
                };
                const roundIdx = disc.rounds.findIndex((r) => r.number === resp.round);
                if (roundIdx >= 0) {
                  disc.rounds = disc.rounds.map((r, i) =>
                    i === roundIdx ? { ...r, responses: [...r.responses, resp] } : r
                  );
                }
                break;
              }
              case 'convergence': {
                if (data.agreed) {
                  disc.convergedAtRound = data.round as number;
                  disc.status = 'converging';
                }
                break;
              }
              case 'consensus': {
                disc.consensus = data.content as string;
                disc.status = 'complete';
                break;
              }
              case 'error': {
                disc.consensus = `Error: ${data.message}`;
                disc.status = 'error';
                break;
              }
            }

            updated[updated.length - 1] = { ...lastMsg, discussion: disc };
            return updated;
          });
        }
      }
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg.role === 'hivemind' && lastMsg.discussion) {
          updated[updated.length - 1] = {
            ...lastMsg,
            discussion: {
              ...lastMsg.discussion,
              consensus: `Error: ${error instanceof Error ? error.message : 'Something went wrong'}`,
              status: 'error',
            },
          };
        }
        return updated;
      });
    }

    setIsLoading(false);
  };

  const saveApiKeys = (keys: UserApiKeys) => {
    setApiKeys(keys);
    localStorage.setItem('hiveminds_apikeys', JSON.stringify(keys));
    setShowApiKeyModal(false);
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🐝</span>
              <h1 className="text-base font-semibold text-zinc-200">HiveMinds</h1>
            </div>
            <div className="h-4 w-px bg-zinc-700" />
            <ModeSelector
              mode={mode}
              onModeChange={handleModeChange}
              autoSwitch={autoSwitch}
              onAutoSwitchChange={handleAutoSwitchChange}
            />
          </div>
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-800/50"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Upgraded pill notification */}
      {upgradedPill && (
        <div className="flex justify-center py-2">
          <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full font-medium animate-pulse">
            Upgraded to Thinking
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
              <span className="text-4xl mb-6">🐝</span>
              <h2 className="text-xl font-medium text-zinc-300 mb-1">
                What can I help with?
              </h2>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="bg-zinc-800 text-zinc-100 rounded-2xl px-4 py-3 max-w-[85%]">
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex gap-2 mb-2 flex-wrap">
                        {msg.attachments.filter(a => a.type === 'image').map((att, i) => (
                          <img key={i} src={att.data} alt={att.name} className="max-h-32 rounded-lg" />
                        ))}
                      </div>
                    )}
                    {msg.content && <p className="text-sm leading-relaxed">{msg.content}</p>}
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-xs">🐝</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {msg.discussion && (
                      <ConsensusMessage discussion={msg.discussion} />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} disabled={isLoading} />

      {/* API Key Modal */}
      {showApiKeyModal && (
        <ApiKeyModal
          keys={apiKeys}
          onSave={saveApiKeys}
          onClose={() => setShowApiKeyModal(false)}
        />
      )}
    </div>
  );
}

function ApiKeyModal({
  keys,
  onSave,
  onClose,
}: {
  keys: UserApiKeys;
  onSave: (keys: UserApiKeys) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<UserApiKeys>({ ...keys });

  const fields: { key: keyof UserApiKeys; label: string; placeholder: string }[] = [
    { key: 'gemini', label: 'Google Gemini (free)', placeholder: 'AIza...' },
    { key: 'groq', label: 'Groq / Llama (free)', placeholder: 'gsk_...' },
    { key: 'mistral', label: 'Mistral (free)', placeholder: 'sk-...' },
    { key: 'cohere', label: 'Cohere (free)', placeholder: 'co-...' },
    { key: 'openrouter', label: 'OpenRouter / Qwen (free)', placeholder: 'sk-or-...' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-zinc-100 mb-1">API Keys</h2>
        <p className="text-sm text-zinc-400 mb-5">
          Free tier: add your own keys. Pro/Max subscribers don&apos;t need these.
        </p>

        <div className="space-y-3">
          {fields.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-medium text-zinc-400 mb-1 block">{label}</label>
              <input
                type="password"
                value={form[key] || ''}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 px-4 py-2 text-sm font-medium bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors"
          >
            Save Keys
          </button>
        </div>
      </div>
    </div>
  );
}
