import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { ConversionFormat } from '../types';
import { SAMPLE_PDFS, generateSamplePDF } from '../services/samplePdfs';

interface FileDropZoneProps {
  onFilesSelected: (files: File[], format: ConversionFormat) => void;
  defaultFormat: ConversionFormat;
  onFormatChange: (format: ConversionFormat) => void;
  isProcessing: boolean;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesSelected,
  defaultFormat,
  onFormatChange,
  isProcessing,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const onDropHandler = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesList: File[] = Array.from(e.dataTransfer.files);
      const pdfFiles = filesList.filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      if (pdfFiles.length > 0) {
        onFilesSelected(pdfFiles, defaultFormat);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesList: File[] = Array.from(e.target.files);
      const pdfFiles = filesList.filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      if (pdfFiles.length > 0) {
        onFilesSelected(pdfFiles, defaultFormat);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadSample = (sampleId: string) => {
    const sampleFile = generateSamplePDF(sampleId);
    onFilesSelected([sampleFile], defaultFormat);
  };

  const formats: { id: ConversionFormat; label: string; icon: React.ReactNode }[] = [
    { id: 'docx', label: 'Word (.docx)', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'xlsx', label: 'Excel (.xlsx)', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
    { id: 'png', label: 'PNG Image', icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { id: 'jpg', label: 'JPG Image', icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { id: 'webp', label: 'WebP', icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { id: 'all', label: 'All Formats', icon: <Layers className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Target Format Segment Control */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-white border border-zinc-200/90 p-1.5 rounded-xl shadow-xs">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider pl-2.5">
          Convert to:
        </span>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 w-full sm:w-auto">
          {formats.map((fmt) => {
            const active = defaultFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                id={`format-btn-${fmt.id}`}
                type="button"
                onClick={() => onFormatChange(fmt.id)}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  active
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                {fmt.icon}
                <span>{fmt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Drag & Drop Zone */}
      <div
        id="dropzone-pdf"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={onDropHandler}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full rounded-2xl border-2 border-dashed transition-all duration-150 cursor-pointer p-8 sm:p-10 flex flex-col items-center justify-center text-center group ${
          isDragOver
            ? 'border-zinc-900 bg-zinc-100/80 scale-[0.99]'
            : 'border-zinc-300 hover:border-zinc-500 bg-white hover:bg-zinc-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 mb-3 group-hover:scale-105 transition duration-150">
          <UploadCloud className="w-6 h-6" />
        </div>

        <p className="text-sm font-semibold text-zinc-900 mb-1">
          Drop PDF files here, or <span className="underline underline-offset-2 text-zinc-900">browse</span>
        </p>
        <p className="text-xs text-zinc-400 max-w-sm">
          Supports multi-page documents, tables, batch queues, and instant client-side conversion.
        </p>
      </div>

      {/* Subtle Instant Test Samples */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5 px-1">
        <span className="text-[11px] text-zinc-400 font-medium">
          Try a sample:
        </span>
        <div className="flex items-center flex-wrap gap-1.5">
          {SAMPLE_PDFS.map((sample) => (
            <button
              key={sample.id}
              id={`btn-sample-${sample.id}`}
              type="button"
              onClick={() => handleLoadSample(sample.id)}
              disabled={isProcessing}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 hover:text-zinc-900 px-2.5 py-1 rounded-md transition cursor-pointer disabled:opacity-50"
            >
              <span>{sample.name}</span>
              <ArrowUpRight className="w-3 h-3 text-zinc-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
