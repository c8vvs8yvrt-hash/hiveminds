'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-3 bg-zinc-900 rounded-xl border border-zinc-700 focus-within:border-amber-500/50 transition-colors p-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the hive anything..."
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none text-sm leading-relaxed"
          />
          <button
            onClick={handleSubmit}
            disabled={disabled || !input.trim()}
            className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black transition-colors flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-zinc-600 text-center mt-2">
          5 AIs discuss your question and reach a consensus
        </p>
      </div>
    </div>
  );
}
