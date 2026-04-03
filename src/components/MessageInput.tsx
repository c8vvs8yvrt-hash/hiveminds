/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, X, Camera, Mic, MicOff, Link as LinkIcon } from 'lucide-react';
import { Attachment } from '@/types';

interface MessageInputProps {
  onSend: (message: string, attachments?: Attachment[]) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

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

  const addImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (attachments.length >= 3) return;

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
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(addImageFile);
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

  // === CAMERA ===
  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setShowCamera(true);
      // Wait for video element to be in DOM
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      // Fallback: if getUserMedia fails (desktop without camera), use file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) addImageFile(file);
      };
      input.click();
    }
  }, [attachments.length]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    setAttachments((prev) => [
      ...prev,
      {
        type: 'image',
        data: dataUrl,
        name: 'camera-photo.jpg',
        mimeType: 'image/jpeg',
      },
    ]);
    closeCamera();
  }, []);

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }, []);

  // === SPEECH TO TEXT ===
  const toggleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SR) {
      alert('Speech recognition is not supported in this browser. Try Chrome or Safari.');
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interim = transcript;
        }
      }
      setInput((prev) => {
        const base = prev.replace(/\u200B.*$/, '').trimEnd();
        const combined = (base ? base + ' ' : '') + finalTranscript + (interim ? '\u200B' + interim : '');
        return combined;
      });
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInput((prev) => prev.replace(/\u200B/g, ''));
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Camera viewfinder */}
        {showCamera && (
          <div className="mb-3 rounded-xl overflow-hidden border border-zinc-700 bg-black relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-h-64 object-cover"
            />
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
              <button
                onClick={closeCamera}
                className="px-4 py-2 bg-zinc-800/80 backdrop-blur text-zinc-300 rounded-full text-sm hover:bg-zinc-700/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                className="w-14 h-14 bg-white rounded-full border-4 border-zinc-400 hover:border-amber-400 transition-colors"
              />
            </div>
          </div>
        )}

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

          {/* Camera button */}
          <button
            onClick={openCamera}
            disabled={disabled || attachments.length >= 3 || showCamera}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 transition-colors flex-shrink-0 rounded-lg hover:bg-zinc-800/50"
            title="Open camera"
          >
            <Camera size={16} />
          </button>

          {/* Voice input button */}
          <button
            onClick={toggleVoice}
            disabled={disabled}
            className={`p-1.5 transition-colors flex-shrink-0 rounded-lg ${
              isListening
                ? 'text-red-400 bg-red-400/10 hover:bg-red-400/20'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={isListening ? 'Listening...' : disabled ? 'Type your next message...' : 'Ask the hive anything...'}
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
        {isListening && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            <p className="text-xs text-red-400">Listening... tap mic to stop</p>
          </div>
        )}
        {!isListening && (
          <p className="text-xs text-zinc-600 text-center mt-2">
            Upload, snap a photo, use voice, or type anything
          </p>
        )}
      </div>
    </div>
  );
}
