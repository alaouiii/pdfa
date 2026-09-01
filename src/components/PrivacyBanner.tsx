import React from 'react';
import { ShieldCheck, Lock, Zap } from 'lucide-react';

export const PrivacyBanner: React.FC = () => {
  return (
    <div className="w-full bg-zinc-50 border border-zinc-200/80 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-zinc-600">
      <div className="flex items-center gap-2">
        <Lock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        <span>
          <strong className="font-semibold text-zinc-900">Zero Server Uploads:</strong> All parsing and conversions happen directly in your browser's WebAssembly sandbox.
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-zinc-500 shrink-0 font-medium">
        <span className="flex items-center gap-1 text-emerald-600">
          <ShieldCheck className="w-3.5 h-3.5" />
          Offline Ready
        </span>
        <span>•</span>
        <span className="flex items-center gap-1 text-zinc-700">
          <Zap className="w-3 h-3 text-amber-500" />
          Instant RAM speed
        </span>
      </div>
    </div>
  );
};
