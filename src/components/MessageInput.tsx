'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { Attachment } from '@/types';

interface MessageInputProps {
  onSend: (message: string, attachments?: Attachment[]) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if ((!trimmed && attachments.length === 0) || disabled) return;
    onSend(trimmed, attachments.length > 0 ? attachments : undefined);
    setInput('');
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (attachments.length >= 3) return; // Max 3 images

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            type: 'image',
            data: dataUrl,
            name: file.name,
            mimeType: file.type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file || attachments.length >= 3) return;

        const reader = new FileReader();
        reader.onload = () => {
          setAttachments((prev) => [
            ...prev,
            {
              type: 'image',
              data: reader.result as string,
              name: 'pasted-image.png',
              mimeType: file.type,
            },
          ]);
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="relative group rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900"
              >
                {att.type === 'image' ? (
                  <img
                    src={att.data}
                    alt={att.name}
                    className="h-16 w-16 object-cover"
                  />
                ) : (
                  <div className="h-16 px-3 flex items-center gap-2 text-xs text-zinc-400">
                    <LinkIcon size={12} />
                    <span className="max-w-[120px] truncate">{att.name}</span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1 -right-1 bg-zinc-800 border border-zinc-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} className="text-zinc-300" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 bg-zinc-900 rounded-xl border border-zinc-700 focus-within:border-amber-500/50 transition-colors p-3">
          {/* File upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || attachments.length >= 3}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 transition-colors flex-shrink-0 rounded-lg hover:bg-zinc-800/50"
            title="Upload image"
          >
            <Paperclip size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Ask the hive anything... (paste images or URLs)"
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none text-sm leading-relaxed"
          />
          <button
            onClick={handleSubmit}
            disabled={disabled || (!input.trim() && attachments.length === 0)}
            className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black transition-colors flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-zinc-600 text-center mt-2">
          Paste images, share URLs, or ask anything
        </p>
      </div>
    </div>
  );
}
