import React from 'react';
import { ShieldCheck, Zap, Layers } from 'lucide-react';

export const FeatureHighlights: React.FC = () => {
  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-zinc-500">
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-zinc-200/80">
        <Zap className="w-4 h-4 text-zinc-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-zinc-800">Direct In-Memory Speed</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Sub-second local rendering on CPU and RAM.</p>
        </div>
      </div>

      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-zinc-200/80">
        <Layers className="w-4 h-4 text-zinc-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-zinc-800">Multi-Format Extraction</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Word .docx, Excel .xlsx, and PNG/JPG/WebP.</p>
        </div>
      </div>

      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-zinc-200/80">
        <ShieldCheck className="w-4 h-4 text-zinc-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-zinc-800">Zero Cloud Storage</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Documents stay on your device at all times.</p>
        </div>
      </div>
    </div>
  );
};
