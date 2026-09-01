import React from 'react';
import { Sliders, Trash2, ShieldCheck, Zap } from 'lucide-react';

interface HeaderProps {
  queueCount: number;
  onClearQueue: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  queueCount,
  onClearQueue,
  onOpenSettings,
}) => {
  return (
    <header className="w-full bg-white/80 backdrop-blur-md border-b border-zinc-200/80 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Minimal Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center text-white font-semibold text-xs tracking-tighter shadow-xs">
            PDF
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900 tracking-tight">
              Converter
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              100% In-Browser
            </span>
          </div>
        </div>

        {/* Minimal Controls */}
        <div className="flex items-center gap-2">
          <button
            id="btn-open-settings"
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
            title="Options & Output Settings"
          >
            <Sliders className="w-3.5 h-3.5 text-zinc-500" />
            <span>Options</span>
          </button>

          {queueCount > 0 && (
            <button
              id="btn-clear-queue"
              type="button"
              onClick={onClearQueue}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
              title="Clear queue"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear ({queueCount})</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
