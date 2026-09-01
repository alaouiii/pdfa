import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Download,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Archive,
  Play,
  RotateCcw,
  Layers,
} from 'lucide-react';
import { FileItem, ConversionFormat } from '../types';
import { downloadConvertedFile } from '../services/converterOrchestrator';

interface ConversionQueueProps {
  items: FileItem[];
  onConvertItem: (id: string) => void;
  onConvertAll: () => void;
  onRemoveItem: (id: string) => void;
  onFormatChange: (id: string, format: ConversionFormat) => void;
  onInspectItem: (item: FileItem) => void;
  onDownloadBatchZip: () => void;
  isProcessingAny: boolean;
}

export const ConversionQueue: React.FC<ConversionQueueProps> = ({
  items,
  onConvertItem,
  onConvertAll,
  onRemoveItem,
  onFormatChange,
  onInspectItem,
  onDownloadBatchZip,
  isProcessingAny,
}) => {
  if (items.length === 0) return null;

  const completedCount = items.filter((i) => i.status === 'completed').length;
  const pendingCount = items.filter((i) => i.status === 'idle').length;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full bg-white border border-zinc-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-3">
      {/* Queue Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-100 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">
            Queue ({items.length})
          </h3>
          <span className="text-[11px] font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
            {completedCount}/{items.length} ready
          </span>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button
              id="btn-convert-all"
              type="button"
              onClick={onConvertAll}
              disabled={isProcessingAny}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {isProcessingAny ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3 h-3 fill-white" />
              )}
              <span>Convert All ({pendingCount})</span>
            </button>
          )}

          {completedCount > 0 && (
            <button
              id="btn-download-all-zip"
              type="button"
              onClick={onDownloadBatchZip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Download ZIP</span>
            </button>
          )}
        </div>
      </div>

      {/* Queue Items */}
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const isProcessing = item.status === 'parsing' || item.status === 'converting';
          const isCompleted = item.status === 'completed';
          const isError = item.status === 'error';

          return (
            <div
              key={item.id}
              className={`p-3 rounded-xl border transition-all ${
                isCompleted
                  ? 'bg-zinc-50/70 border-zinc-200'
                  : isProcessing
                  ? 'bg-zinc-50 border-zinc-300'
                  : isError
                  ? 'bg-red-50/50 border-red-200'
                  : 'bg-white border-zinc-200/80 hover:border-zinc-300'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                {/* File Thumbnail & Meta */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200/80 flex items-center justify-center shrink-0 overflow-hidden text-zinc-600">
                    {item.extractedDoc?.pages[0]?.thumbnailUrl ? (
                      <img
                        src={item.extractedDoc.pages[0].thumbnailUrl}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-zinc-900 truncate max-w-sm">
                        {item.name}
                      </p>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {formatFileSize(item.size)}
                      </span>
                      {item.extractedDoc && (
                        <span className="text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded font-medium">
                          {item.extractedDoc.totalPages}p
                        </span>
                      )}
                    </div>

                    <div className="mt-0.5 flex items-center gap-2">
                      {isProcessing && (
                        <span className="text-[11px] text-zinc-600 flex items-center gap-1 font-medium">
                          <Loader2 className="w-3 h-3 animate-spin text-zinc-900" />
                          {item.statusMessage || 'Processing...'}
                        </span>
                      )}

                      {isCompleted && item.output && (
                        <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Ready ({(item.output.timeTakenMs / 1000).toFixed(2)}s)
                        </span>
                      )}

                      {isError && (
                        <span className="text-[11px] text-red-600 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3" />
                          {item.error || 'Conversion error'}
                        </span>
                      )}

                      {item.status === 'idle' && (
                        <span className="text-[11px] text-zinc-400">Ready</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Format & Actions */}
                <div className="flex items-center flex-wrap gap-1.5 self-stretch md:self-auto justify-end shrink-0">
                  {/* Format Selector if Idle */}
                  {item.status === 'idle' && (
                    <div className="flex items-center bg-zinc-100 rounded-md p-0.5">
                      {(['docx', 'xlsx', 'png', 'jpg', 'webp', 'all'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => onFormatChange(item.id, fmt)}
                          className={`px-1.5 py-0.5 text-[10px] rounded font-bold uppercase transition cursor-pointer ${
                            item.selectedFormat === fmt
                              ? 'bg-zinc-900 text-white shadow-2xs'
                              : 'text-zinc-500 hover:text-zinc-900'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Convert Single Button */}
                  {item.status === 'idle' && (
                    <button
                      id={`btn-convert-${item.id}`}
                      type="button"
                      onClick={() => onConvertItem(item.id)}
                      disabled={isProcessingAny}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Convert</span>
                    </button>
                  )}

                  {/* Download DOCX */}
                  {isCompleted && item.output?.docxBlob && (
                    <button
                      id={`btn-dl-docx-${item.id}`}
                      type="button"
                      onClick={() => downloadConvertedFile(item, 'docx')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Word</span>
                      <Download className="w-3 h-3 ml-0.5" />
                    </button>
                  )}

                  {/* Download XLSX */}
                  {isCompleted && item.output?.xlsxBlob && (
                    <button
                      id={`btn-dl-xlsx-${item.id}`}
                      type="button"
                      onClick={() => downloadConvertedFile(item, 'xlsx')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3 h-3" />
                      <span>Excel</span>
                      <Download className="w-3 h-3 ml-0.5" />
                    </button>
                  )}

                  {/* Download PNG */}
                  {isCompleted && (item.output?.pngBlob || (item.output?.pngPages && item.output.pngPages.length > 0)) && (
                    <button
                      id={`btn-dl-png-${item.id}`}
                      type="button"
                      onClick={() => downloadConvertedFile(item, 'png')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>PNG</span>
                      <Download className="w-3 h-3 ml-0.5" />
                    </button>
                  )}

                  {/* Download JPG */}
                  {isCompleted && (item.output?.jpgBlob || (item.output?.jpgPages && item.output.jpgPages.length > 0)) && (
                    <button
                      id={`btn-dl-jpg-${item.id}`}
                      type="button"
                      onClick={() => downloadConvertedFile(item, 'jpg')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>JPG</span>
                      <Download className="w-3 h-3 ml-0.5" />
                    </button>
                  )}

                  {/* Download WebP */}
                  {isCompleted && (item.output?.webpBlob || (item.output?.webpPages && item.output.webpPages.length > 0)) && (
                    <button
                      id={`btn-dl-webp-${item.id}`}
                      type="button"
                      onClick={() => downloadConvertedFile(item, 'webp')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>WebP</span>
                      <Download className="w-3 h-3 ml-0.5" />
                    </button>
                  )}

                  {/* Download All Zip */}
                  {isCompleted && item.selectedFormat === 'all' && (
                    <button
                      id={`btn-dl-all-${item.id}`}
                      type="button"
                      onClick={() => downloadConvertedFile(item, 'all')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      <Layers className="w-3 h-3" />
                      <span>All (.ZIP)</span>
                      <Download className="w-3 h-3 ml-0.5" />
                    </button>
                  )}

                  {/* Preview */}
                  {isCompleted && item.extractedDoc && (
                    <button
                      id={`btn-inspect-${item.id}`}
                      type="button"
                      onClick={() => onInspectItem(item)}
                      className="p-1 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
                      title="Inspect extracted tables & layout"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}

                  {/* Reconvert */}
                  {isCompleted && (
                    <button
                      type="button"
                      onClick={() => onConvertItem(item.id)}
                      title="Reconvert"
                      className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    disabled={isProcessing}
                    className="p-1 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer disabled:opacity-40"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              {isProcessing && (
                <div className="w-full bg-zinc-100 rounded-full h-1 mt-2.5 overflow-hidden">
                  <div
                    className="bg-zinc-900 h-full rounded-full transition-all duration-150"
                    style={{ width: `${Math.max(item.progress, 5)}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
