import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { PrivacyBanner } from './components/PrivacyBanner';
import { FileDropZone } from './components/FileDropZone';
import { ConversionQueue } from './components/ConversionQueue';
import { DocPreviewModal } from './components/DocPreviewModal';
import { SettingsModal } from './components/SettingsModal';
import { FeatureHighlights } from './components/FeatureHighlights';
import { FileItem, ConversionFormat, ConversionOptions } from './types';
import { convertSingleFile, downloadBatchZip } from './services/converterOrchestrator';

export default function App() {
  const [options, setOptions] = useState<ConversionOptions>({
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
  });

  const [items, setItems] = useState<FileItem[]>([]);
  const [inspectItem, setInspectItem] = useState<FileItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProcessingAny, setIsProcessingAny] = useState(false);

  // Handle files dropped or selected
  const handleFilesSelected = useCallback((files: File[], defaultFmt: ConversionFormat) => {
    const newItems: FileItem[] = files.map((file) => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      file,
      name: file.name,
      size: file.size,
      status: 'idle',
      progress: 0,
      selectedFormat: defaultFmt,
      customOptions: { ...options, format: defaultFmt },
    }));

    setItems((prev) => [...prev, ...newItems]);
  }, [options]);

  // Convert a single queued item
  const handleConvertItem = async (itemId: string) => {
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem || targetItem.status === 'parsing' || targetItem.status === 'converting') {
      return;
    }

    setIsProcessingAny(true);

    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, status: 'parsing', progress: 10, statusMessage: 'Reading PDF...' }
          : i
      )
    );

    try {
      const result = await convertSingleFile(targetItem, (progress, message) => {
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  status: progress >= 60 ? 'converting' : 'parsing',
                  progress,
                  statusMessage: message,
                }
              : i
          )
        );
      });

      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                status: 'completed',
                progress: 100,
                statusMessage: `Completed in ${(result.output.timeTakenMs / 1000).toFixed(2)}s`,
                extractedDoc: result.extractedDoc,
                output: result.output,
              }
            : i
        )
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Conversion failed';
      console.error('Conversion error:', err);
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                status: 'error',
                progress: 0,
                error: errorMsg,
              }
            : i
        )
      );
    } finally {
      setIsProcessingAny(false);
    }
  };

  // Convert all pending files sequentially
  const handleConvertAll = async () => {
    const pending = items.filter((i) => i.status === 'idle' || i.status === 'error');
    if (pending.length === 0) return;

    setIsProcessingAny(true);

    for (const item of pending) {
      await handleConvertItem(item.id);
    }

    setIsProcessingAny(false);
  };

  // Remove single item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (inspectItem?.id === id) {
      setInspectItem(null);
    }
  };

  // Clear entire queue
  const handleClearQueue = () => {
    setItems([]);
    setInspectItem(null);
  };

  // Change format for specific item
  const handleItemFormatChange = (id: string, format: ConversionFormat) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              selectedFormat: format,
              customOptions: { ...i.customOptions, format },
            }
          : i
      )
    );
  };

  // Batch download ZIP of all converted files
  const handleDownloadBatchZip = async () => {
    const completedItems = items.filter((i) => i.status === 'completed' && i.output);
    if (completedItems.length === 0) return;

    await downloadBatchZip(completedItems);
  };

  return (
    <div className="min-h-screen bg-zinc-50/70 text-zinc-900 flex flex-col font-sans selection:bg-zinc-900 selection:text-white antialiased">
      {/* Minimal Header */}
      <Header
        queueCount={items.length}
        onClearQueue={handleClearQueue}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Focus Canvas */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-4">
        {/* Subtle Privacy Info */}
        <PrivacyBanner />

        {/* Minimalist Dropzone & Format Chooser */}
        <FileDropZone
          onFilesSelected={handleFilesSelected}
          defaultFormat={options.format}
          onFormatChange={(fmt) => setOptions((prev) => ({ ...prev, format: fmt }))}
          isProcessing={isProcessingAny}
        />

        {/* Conversion Queue */}
        <ConversionQueue
          items={items}
          onConvertItem={handleConvertItem}
          onConvertAll={handleConvertAll}
          onRemoveItem={handleRemoveItem}
          onFormatChange={handleItemFormatChange}
          onInspectItem={(item) => setInspectItem(item)}
          onDownloadBatchZip={handleDownloadBatchZip}
          isProcessingAny={isProcessingAny}
        />

        {/* Subtle Feature Strip */}
        <FeatureHighlights />
      </main>

      {/* Minimalist Footer */}
      <footer className="w-full border-t border-zinc-200/80 bg-white py-3 text-center text-xs text-zinc-400">
        <p>Private Client-Side PDF Converter • Word • Excel • PNG • JPG • WebP</p>
      </footer>

      {/* Document Inspector Modal */}
      {inspectItem && (
        <DocPreviewModal
          item={inspectItem}
          onClose={() => setInspectItem(null)}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        options={options}
        onOptionsChange={setOptions}
      />
    </div>
  );
}
