'use client';

import { useState, useRef, useEffect } from 'react';
import { DiscussionMode } from '@/types';
import { ChevronDown, Check, Zap, Brain, Microscope, Lock } from 'lucide-react';

interface ModeSelectorProps {
  mode: DiscussionMode;
  onModeChange: (mode: DiscussionMode) => void;
  autoSwitch: boolean;
  onAutoSwitchChange: (enabled: boolean) => void;
}

const MODES: { id: DiscussionMode; label: string; subtitle: string; icon: typeof Zap; requiresPro: boolean }[] = [
  { id: 'instant', label: 'Instant', subtitle: 'For everyday questions', icon: Zap, requiresPro: false },
  { id: 'thinking', label: 'Thinking', subtitle: 'For complex questions', icon: Brain, requiresPro: false },
  { id: 'deep', label: 'Deep', subtitle: 'For research-grade answers', icon: Microscope, requiresPro: true },
];

export default function ModeSelector({ mode, onModeChange, autoSwitch, onAutoSwitchChange }: ModeSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = MODES.find((m) => m.id === mode)!;
  const Icon = current.icon;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-zinc-800/60 transition-colors text-zinc-300"
      >
        <Icon size={14} className="text-amber-500" />
        <span className="text-sm font-medium">{current.label}</span>
        <ChevronDown size={12} className={`text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-1.5">
            {MODES.map((m) => {
              const MIcon = m.icon;
              const isActive = mode === m.id;
              const isLocked = m.requiresPro;

              return (
                <button
                  key={m.id}
                  onClick={() => {
                    if (!isLocked) {
                      onModeChange(m.id);
                      setOpen(false);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                    isActive ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
                  } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <MIcon size={16} className={isActive ? 'text-amber-500' : 'text-zinc-400'} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${isActive ? 'text-zinc-100' : 'text-zinc-300'}`}>
                        {m.label}
                      </span>
                      {isLocked && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                          <Lock size={8} /> PRO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">{m.subtitle}</p>
                  </div>
                  {isActive && <Check size={14} className="text-amber-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-zinc-800 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-300">Auto-switch to Thinking</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Auto-upgrade for complex questions</p>
              </div>
              <button
                onClick={() => onAutoSwitchChange(!autoSwitch)}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  autoSwitch ? 'bg-amber-500' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    autoSwitch ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
