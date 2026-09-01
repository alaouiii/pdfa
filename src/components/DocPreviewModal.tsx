import React, { useState } from 'react';
import {
  X,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Download,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers,
  Table as TableIcon,
  Code2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { FileItem, ConvertedPageImage } from '../types';
import { downloadConvertedFile, downloadPageImage } from '../services/converterOrchestrator';

interface DocPreviewModalProps {
  item: FileItem | null;
  onClose: () => void;
}

export const DocPreviewModal: React.FC<DocPreviewModalProps> = ({ item, onClose }) => {
  if (!item || !item.extractedDoc) return null;

  const doc = item.extractedDoc;
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'docx' | 'xlsx' | 'images' | 'raw'>('docx');
  const [copiedText, setCopiedText] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageFormatChoice, setImageFormatChoice] = useState<'png' | 'jpg' | 'webp'>('png');

  const currentPage = doc.pages[selectedPageIndex] || doc.pages[0];

  const handleCopyRaw = () => {
    if (doc.fullText) {
      navigator.clipboard.writeText(doc.fullText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const currentPngPage = item.output?.pngPages?.[selectedPageIndex];
  const currentJpgPage = item.output?.jpgPages?.[selectedPageIndex];
  const currentWebpPage = item.output?.webpPages?.[selectedPageIndex];

  const activePageImage: ConvertedPageImage | undefined =
    imageFormatChoice === 'png'
      ? currentPngPage
      : imageFormatChoice === 'jpg'
      ? currentJpgPage
      : currentWebpPage;

  const displayImageSrc =
    activePageImage?.dataUrl ||
    currentPngPage?.dataUrl ||
    currentJpgPage?.dataUrl ||
    currentPage.thumbnailUrl;

  const handleDownloadSinglePageImage = (fmt: 'png' | 'jpg' | 'webp') => {
    const targetPage =
      fmt === 'png'
        ? item.output?.pngPages?.[selectedPageIndex]
        : fmt === 'jpg'
        ? item.output?.jpgPages?.[selectedPageIndex]
        : item.output?.webpPages?.[selectedPageIndex];

    if (targetPage) {
      downloadPageImage(targetPage, item.name);
    } else if (currentPage.thumbnailUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        if (ctx) {
          if (fmt !== 'png') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, c.width, c.height);
          }
          ctx.drawImage(img, 0, 0);
          const mime = fmt === 'png' ? 'image/png' : fmt === 'jpg' ? 'image/jpeg' : 'image/webp';
          c.toBlob((b) => {
            if (b) {
              const cleanName = item.name.replace(/\.pdf$/i, '');
              const pageNumStr = String(currentPage.pageNumber).padStart(2, '0');
              const link = document.createElement('a');
              link.href = URL.createObjectURL(b);
              link.download = `${cleanName}_page_${pageNumStr}.${fmt}`;
              link.click();
            }
          }, mime, 0.92);
        }
      };
      img.src = currentPage.thumbnailUrl;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-900/40 backdrop-blur-xs overflow-hidden">
      <div className="w-full max-w-5xl max-h-[92vh] bg-white border border-zinc-200 rounded-2xl shadow-xl flex flex-col overflow-hidden text-zinc-900">
        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-zinc-200/80 flex items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <h3 className="text-sm font-semibold text-zinc-900 truncate">
              {item.name}
            </h3>
            <span className="text-xs text-zinc-400 font-normal">
              • {doc.totalPages} {doc.totalPages === 1 ? 'page' : 'pages'}
              {doc.allTables.length > 0 && ` • ${doc.allTables.length} tables`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {item.output?.docxBlob && (
              <button
                type="button"
                onClick={() => downloadConvertedFile(item, 'docx')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition cursor-pointer"
              >
                <span>Word</span>
                <Download className="w-3 h-3" />
              </button>
            )}

            {item.output?.xlsxBlob && (
              <button
                type="button"
                onClick={() => downloadConvertedFile(item, 'xlsx')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition cursor-pointer"
              >
                <span>Excel</span>
                <Download className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-zinc-200">
          {/* Left Thumbnail & Page Selector */}
          <div className="md:col-span-4 p-4 bg-zinc-50 flex flex-col gap-3 overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Visual Page
              </span>

              {doc.totalPages > 1 && (
                <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-md p-0.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPageIndex((p) => Math.max(0, p - 1))}
                    disabled={selectedPageIndex === 0}
                    className="p-0.5 rounded text-zinc-500 hover:text-zinc-900 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] px-1 font-mono font-medium text-zinc-700">
                    {selectedPageIndex + 1}/{doc.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPageIndex((p) => Math.min(doc.totalPages - 1, p + 1))}
                    disabled={selectedPageIndex === doc.totalPages - 1}
                    className="p-0.5 rounded text-zinc-500 hover:text-zinc-900 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="w-full rounded-xl border border-zinc-200 bg-white p-2 flex items-center justify-center overflow-hidden min-h-[200px]">
              {currentPage.thumbnailUrl ? (
                <img
                  src={currentPage.thumbnailUrl}
                  alt={`Page ${currentPage.pageNumber}`}
                  className="max-h-[300px] w-auto object-contain rounded"
                />
              ) : (
                <FileText className="w-8 h-8 text-zinc-300" />
              )}
            </div>

            {/* Quick Page Download */}
            <div className="flex items-center justify-between gap-1.5 p-2 bg-white rounded-lg border border-zinc-200">
              <span className="text-[11px] text-zinc-500 font-medium">Export Page:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleDownloadSinglePageImage('png')}
                  className="px-2 py-0.5 text-[10px] font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded transition cursor-pointer"
                >
                  PNG
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadSinglePageImage('jpg')}
                  className="px-2 py-0.5 text-[10px] font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded transition cursor-pointer"
                >
                  JPG
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadSinglePageImage('webp')}
                  className="px-2 py-0.5 text-[10px] font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded transition cursor-pointer"
                >
                  WebP
                </button>
              </div>
            </div>
          </div>

          {/* Right Preview Pane */}
          <div className="md:col-span-8 flex flex-col min-h-0 bg-white overflow-hidden">
            {/* Minimal Tabs */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 gap-2">
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: 'docx', label: 'Document', icon: <FileText className="w-3.5 h-3.5" /> },
                    { id: 'xlsx', label: `Tables (${doc.allTables.length})`, icon: <TableIcon className="w-3.5 h-3.5" /> },
                    { id: 'images', label: 'Images', icon: <ImageIcon className="w-3.5 h-3.5" /> },
                    { id: 'raw', label: 'Text', icon: <Code2 className="w-3.5 h-3.5" /> },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {activeTab === 'raw' && (
                <button
                  type="button"
                  onClick={handleCopyRaw}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            {/* Tab Body */}
            <div className="flex-1 p-4 overflow-y-auto bg-zinc-50/50">
              {activeTab === 'docx' && (
                <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl border border-zinc-200/80 shadow-2xs space-y-3">
                  {currentPage.lines.map((line, lIdx) => {
                    if (line.isHeading) {
                      return (
                        <h2 key={lIdx} className="text-base font-bold text-zinc-900 pt-2 pb-0.5">
                          {line.text}
                        </h2>
                      );
                    }
                    if (line.isListItem) {
                      return (
                        <li key={lIdx} className="ml-4 text-xs text-zinc-700 list-disc">
                          {line.text.replace(/^([\u2022\u25E6\u25AA\u2023\u2219\u00B7\*\-–]|\d+[\.\)]|[a-zA-Z][\.\)])\s+/, '')}
                        </li>
                      );
                    }
                    return (
                      <p key={lIdx} className="text-xs text-zinc-700 leading-relaxed">
                        {line.text}
                      </p>
                    );
                  })}
                </div>
              )}

              {activeTab === 'xlsx' && (
                <div className="space-y-4">
                  {doc.allTables.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-400">
                      No discrete tables detected in document.
                    </div>
                  ) : (
                    doc.allTables.map((table, tIdx) => (
                      <div key={tIdx} className="bg-white border border-zinc-200 rounded-xl p-3 overflow-x-auto shadow-2xs">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-200 font-semibold text-zinc-800">
                              {table.headers.map((h, i) => (
                                <th key={i} className="p-2 border-r border-zinc-200 last:border-r-0">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {table.rows.slice(1).map((row, rIdx) => (
                              <tr key={rIdx} className="border-b border-zinc-100 hover:bg-zinc-50/60">
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className={`p-2 border-r border-zinc-100 last:border-r-0 text-zinc-700 ${
                                      cell.align === 'right' ? 'text-right font-mono' : 'text-left'
                                    }`}
                                  >
                                    {cell.text}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'images' && (
                <div className="flex flex-col items-center gap-4">
                  {displayImageSrc ? (
                    <img
                      src={displayImageSrc}
                      alt="Rendered page"
                      className="max-w-full rounded-lg border border-zinc-200 shadow-sm bg-white"
                    />
                  ) : (
                    <div className="p-8 text-xs text-zinc-400">Image not available</div>
                  )}
                </div>
              )}

              {activeTab === 'raw' && (
                <div className="bg-white p-4 rounded-xl border border-zinc-200">
                  <pre className="font-mono text-xs text-zinc-700 whitespace-pre-wrap leading-relaxed select-text">
                    {doc.fullText || 'No text extracted.'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
