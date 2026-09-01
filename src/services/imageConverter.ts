import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { ConvertedPageImage, ConversionOptions } from '../types';

/**
 * Converts all pages of a PDF document to crisp image format (PNG, JPG, or WEBP)
 * Uses high-DPI canvas rendering in memory directly on the user's device
 */
export async function convertPdfToImages(
  fileOrBuffer: File | ArrayBuffer,
  format: 'png' | 'jpg' | 'webp',
  options: ConversionOptions,
  onProgress?: (progress: number, message: string) => void
): Promise<{ pages: ConvertedPageImage[]; zipBlob?: Blob; singleImageBlob?: Blob }> {
  const arrayBuffer =
    fileOrBuffer instanceof File
      ? await fileOrBuffer.arrayBuffer()
      : fileOrBuffer;

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;
  const pages: ConvertedPageImage[] = [];
  const scale = options.imageScale || 2.0; // 2.0 = ~150-200 DPI, 3.0 = 300 DPI
  const quality = options.imageQuality || 0.92;

  const mimeType =
    format === 'png'
      ? 'image/png'
      : format === 'jpg'
      ? 'image/jpeg'
      : 'image/webp';

  const ext = format === 'jpg' ? 'jpg' : format;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress) {
      const pct = Math.round(((pageNum - 1) / totalPages) * 100);
      onProgress(
        pct,
        `Rendering Page ${pageNum} of ${totalPages} at ${Math.round(scale * 72)} DPI to ${format.toUpperCase()}...`
      );
    }

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d', { alpha: format === 'png' });

    if (!ctx) {
      throw new Error('Failed to create HTML5 canvas context for rendering.');
    }

    // If JPEG/WEBP, paint solid white background first
    if (format !== 'png') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await (page.render as (params: Record<string, unknown>) => { promise: Promise<unknown> })({
      canvasContext: ctx,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    // Convert canvas to Blob
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error(`Failed to convert canvas to ${format.toUpperCase()} blob.`));
        },
        mimeType,
        quality
      );
    });

    const dataUrl = canvas.toDataURL(mimeType, quality);

    pages.push({
      pageNumber: pageNum,
      blob,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      format,
      size: blob.size,
    });
  }

  // If single page, we can directly provide the image blob
  let singleImageBlob: Blob | undefined;
  if (pages.length === 1) {
    singleImageBlob = pages[0].blob;
  }

  // If multiple pages or if bundleMultiPageZip is requested, create a ZIP bundle
  let zipBlob: Blob | undefined;
  if (pages.length > 1) {
    const zip = new JSZip();
    for (let i = 0; i < pages.length; i++) {
      const pageNumStr = String(pages[i].pageNumber).padStart(2, '0');
      zip.file(`page_${pageNumStr}.${ext}`, pages[i].blob);
    }
    zipBlob = await zip.generateAsync({ type: 'blob' });
  }

  return { pages, zipBlob, singleImageBlob };
}
