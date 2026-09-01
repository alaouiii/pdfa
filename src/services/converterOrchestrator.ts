import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ConvertedOutput, ConvertedPageImage, ExtractedPDFDocument, FileItem } from '../types';
import { extractPDFContent } from './pdfExtractor';
import { convertToDocx } from './docxConverter';
import { convertToXlsx } from './xlsxConverter';
import { convertPdfToImages } from './imageConverter';

/**
 * Executes high-speed 100% in-browser conversion of a single PDF file
 */
export async function convertSingleFile(
  fileItem: FileItem,
  onProgress: (progress: number, message: string) => void
): Promise<{ extractedDoc: ExtractedPDFDocument; output: ConvertedOutput }> {
  const startTime = performance.now();

  // 1. Extract structure & text from PDF
  onProgress(10, 'Reading PDF binary directly in memory...');
  const extractedDoc = await extractPDFContent(
    fileItem.file,
    fileItem.customOptions,
    (pct, msg) => onProgress(Math.round(pct * 0.4), msg)
  );

  const output: ConvertedOutput = {
    timeTakenMs: 0,
  };

  const format = fileItem.selectedFormat;

  // 2. Generate Word DOCX if requested
  if (format === 'docx' || format === 'both' || format === 'all') {
    onProgress(45, 'Building formatted Microsoft Word (.docx)...');
    const docxBlob = await convertToDocx(
      extractedDoc,
      fileItem.customOptions,
      (pct, msg) => onProgress(45 + Math.round(pct * 0.15), msg)
    );
    output.docxBlob = docxBlob;
    output.docxSize = docxBlob.size;
  }

  // 3. Generate Excel XLSX if requested
  if (format === 'xlsx' || format === 'both' || format === 'all') {
    onProgress(60, 'Building structured Excel (.xlsx) workbook...');
    const xlsxBlob = await convertToXlsx(
      extractedDoc,
      fileItem.customOptions,
      (pct, msg) => onProgress(60 + Math.round(pct * 0.15), msg)
    );
    output.xlsxBlob = xlsxBlob;
    output.xlsxSize = xlsxBlob.size;
  }

  // 4. Generate PNG Images if requested
  if (format === 'png' || format === 'all') {
    onProgress(75, 'Rendering high-definition PNG images...');
    const res = await convertPdfToImages(
      fileItem.file,
      'png',
      fileItem.customOptions,
      (pct, msg) => onProgress(75 + Math.round(pct * 0.1), msg)
    );
    output.pngPages = res.pages;
    output.pngBlob = res.zipBlob || res.singleImageBlob;
    output.pngSize = output.pngBlob?.size || res.pages.reduce((acc, p) => acc + p.size, 0);
  }

  // 5. Generate JPG Images if requested
  if (format === 'jpg' || format === 'all') {
    onProgress(85, 'Rendering crisp JPG images...');
    const res = await convertPdfToImages(
      fileItem.file,
      'jpg',
      fileItem.customOptions,
      (pct, msg) => onProgress(85 + Math.round(pct * 0.08), msg)
    );
    output.jpgPages = res.pages;
    output.jpgBlob = res.zipBlob || res.singleImageBlob;
    output.jpgSize = output.jpgBlob?.size || res.pages.reduce((acc, p) => acc + p.size, 0);
  }

  // 6. Generate WEBP Images if requested
  if (format === 'webp' || format === 'all') {
    onProgress(92, 'Rendering modern WebP images...');
    const res = await convertPdfToImages(
      fileItem.file,
      'webp',
      fileItem.customOptions,
      (pct, msg) => onProgress(92 + Math.round(pct * 0.06), msg)
    );
    output.webpPages = res.pages;
    output.webpBlob = res.zipBlob || res.singleImageBlob;
    output.webpSize = output.webpBlob?.size || res.pages.reduce((acc, p) => acc + p.size, 0);
  }

  const endTime = performance.now();
  output.timeTakenMs = Math.round(endTime - startTime);

  onProgress(100, `Conversion complete in ${(output.timeTakenMs / 1000).toFixed(2)}s!`);

  return { extractedDoc, output };
}

/**
 * Downloads a single converted file or image archive with appropriate extension
 */
export function downloadConvertedFile(
  fileItem: FileItem,
  format: 'docx' | 'xlsx' | 'png' | 'jpg' | 'webp' | 'all'
) {
  const baseName = fileItem.name.replace(/\.pdf$/i, '');
  const out = fileItem.output;
  if (!out) return;

  if (format === 'docx' && out.docxBlob) {
    saveAs(out.docxBlob, `${baseName}.docx`);
  } else if (format === 'xlsx' && out.xlsxBlob) {
    saveAs(out.xlsxBlob, `${baseName}.xlsx`);
  } else if (format === 'png') {
    if (out.pngPages && out.pngPages.length === 1) {
      saveAs(out.pngPages[0].blob, `${baseName}_page_1.png`);
    } else if (out.pngBlob) {
      saveAs(out.pngBlob, `${baseName}_png_images.zip`);
    }
  } else if (format === 'jpg') {
    if (out.jpgPages && out.jpgPages.length === 1) {
      saveAs(out.jpgPages[0].blob, `${baseName}_page_1.jpg`);
    } else if (out.jpgBlob) {
      saveAs(out.jpgBlob, `${baseName}_jpg_images.zip`);
    }
  } else if (format === 'webp') {
    if (out.webpPages && out.webpPages.length === 1) {
      saveAs(out.webpPages[0].blob, `${baseName}_page_1.webp`);
    } else if (out.webpBlob) {
      saveAs(out.webpBlob, `${baseName}_webp_images.zip`);
    }
  } else if (format === 'all') {
    // Generate a single ZIP with all available converted files
    downloadSingleItemAllZip(fileItem);
  }
}

/**
 * Downloads a single individual page image
 */
export function downloadPageImage(
  pageImage: ConvertedPageImage,
  documentBaseName: string
) {
  const cleanName = documentBaseName.replace(/\.pdf$/i, '');
  const pageNumStr = String(pageImage.pageNumber).padStart(2, '0');
  const ext = pageImage.format === 'jpg' ? 'jpg' : pageImage.format;
  saveAs(pageImage.blob, `${cleanName}_page_${pageNumStr}.${ext}`);
}

/**
 * Downloads all outputs for a single document in one ZIP package
 */
export async function downloadSingleItemAllZip(fileItem: FileItem) {
  const out = fileItem.output;
  if (!out) return;
  const baseName = fileItem.name.replace(/\.pdf$/i, '');
  const zip = new JSZip();

  if (out.docxBlob) {
    zip.file(`${baseName}.docx`, out.docxBlob);
  }
  if (out.xlsxBlob) {
    zip.file(`${baseName}.xlsx`, out.xlsxBlob);
  }
  if (out.pngPages && out.pngPages.length > 0) {
    const pngFolder = zip.folder('png_images');
    out.pngPages.forEach((p) => {
      pngFolder?.file(`page_${String(p.pageNumber).padStart(2, '0')}.png`, p.blob);
    });
  }
  if (out.jpgPages && out.jpgPages.length > 0) {
    const jpgFolder = zip.folder('jpg_images');
    out.jpgPages.forEach((p) => {
      jpgFolder?.file(`page_${String(p.pageNumber).padStart(2, '0')}.jpg`, p.blob);
    });
  }
  if (out.webpPages && out.webpPages.length > 0) {
    const webpFolder = zip.folder('webp_images');
    out.webpPages.forEach((p) => {
      webpFolder?.file(`page_${String(p.pageNumber).padStart(2, '0')}.webp`, p.blob);
    });
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${baseName}_All_Formats.zip`);
}

/**
 * Bundles multiple converted files into a single ZIP archive for 1-click batch download
 */
export async function downloadBatchZip(
  items: FileItem[],
  onProgress?: (pct: number) => void
) {
  const zip = new JSZip();
  let count = 0;

  for (const item of items) {
    if (!item.output) continue;
    const baseName = item.name.replace(/\.pdf$/i, '');
    const out = item.output;

    if (out.docxBlob) {
      zip.file(`${baseName}.docx`, out.docxBlob);
      count++;
    }

    if (out.xlsxBlob) {
      zip.file(`${baseName}.xlsx`, out.xlsxBlob);
      count++;
    }

    if (out.pngPages && out.pngPages.length > 0) {
      const folder = zip.folder(`${baseName}_png`);
      out.pngPages.forEach((p) => {
        folder?.file(`page_${String(p.pageNumber).padStart(2, '0')}.png`, p.blob);
      });
      count++;
    }

    if (out.jpgPages && out.jpgPages.length > 0) {
      const folder = zip.folder(`${baseName}_jpg`);
      out.jpgPages.forEach((p) => {
        folder?.file(`page_${String(p.pageNumber).padStart(2, '0')}.jpg`, p.blob);
      });
      count++;
    }

    if (out.webpPages && out.webpPages.length > 0) {
      const folder = zip.folder(`${baseName}_webp`);
      out.webpPages.forEach((p) => {
        folder?.file(`page_${String(p.pageNumber).padStart(2, '0')}.webp`, p.blob);
      });
      count++;
    }
  }

  if (count === 0) return;

  if (onProgress) onProgress(40);
  const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress) onProgress(Math.round(metadata.percent));
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  saveAs(zipBlob, `Converted_Documents_${timestamp}.zip`);
}
