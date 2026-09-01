import React from 'react';
import { X, Sliders, Check, RotateCcw } from 'lucide-react';
import { ConversionOptions } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: ConversionOptions;
  onOptionsChange: (newOptions: ConversionOptions) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  options,
  onOptionsChange,
}) => {
  if (!isOpen) return null;

  const defaultDefaults: ConversionOptions = {
    format: 'docx',
    includeImages: true,
    detectTables: true,
    tableSensitivity: 'medium',
    preservePageBreaks: true,
    excelSheetMode: 'auto_tables',
    numberFormatting: true,
    imageScale: 2,
    imageQuality: 0.92,
    bundleMultiPageZip: true,
  };

  const handleResetDefaults = () => {
    onOptionsChange(defaultDefaults);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-2xl shadow-xl p-5 text-zinc-900 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-zinc-700" />
            <h3 className="text-sm font-semibold text-zinc-900">Conversion Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-4 text-xs">
          {/* Image DPI Resolution */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-800 block">
              Image Output Quality (PNG / JPG / WebP)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { scale: 1, label: '72 DPI', desc: 'Standard' },
                { scale: 2, label: '150 DPI', desc: 'High-Res' },
                { scale: 3, label: '300 DPI', desc: 'Print HD' },
              ].map((res) => (
                <button
                  key={res.scale}
                  type="button"
                  onClick={() => onOptionsChange({ ...options, imageScale: res.scale })}
                  className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                    (options.imageScale || 2) === res.scale
                      ? 'bg-zinc-900 border-zinc-900 text-white shadow-2xs'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <p className="font-semibold">{res.label}</p>
                  <p className={`text-[10px] ${(options.imageScale || 2) === res.scale ? 'text-zinc-300' : 'text-zinc-400'}`}>
                    {res.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Table Sensitivity */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-800 block">
              Table Detection Level
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => onOptionsChange({ ...options, tableSensitivity: level })}
                  className={`p-1.5 rounded-lg border text-center font-medium capitalize transition cursor-pointer ${
                    options.tableSensitivity === level
                      ? 'bg-zinc-900 border-zinc-900 text-white'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t border-zinc-100">
            <label className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 hover:bg-zinc-100/70 cursor-pointer transition">
              <div>
                <p className="font-medium text-zinc-800">Excel Numeric & Currency Parsing</p>
                <p className="text-[11px] text-zinc-400">Keep real numbers for formula calculations</p>
              </div>
              <input
                type="checkbox"
                checked={options.numberFormatting}
                onChange={(e) => onOptionsChange({ ...options, numberFormatting: e.target.checked })}
                className="w-4 h-4 accent-zinc-900 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 hover:bg-zinc-100/70 cursor-pointer transition">
              <div>
                <p className="font-medium text-zinc-800">Preserve PDF Page Breaks</p>
                <p className="text-[11px] text-zinc-400">Insert section breaks between pages</p>
              </div>
              <input
                type="checkbox"
                checked={options.preservePageBreaks}
                onChange={(e) => onOptionsChange({ ...options, preservePageBreaks: e.target.checked })}
                className="w-4 h-4 accent-zinc-900 rounded"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};
