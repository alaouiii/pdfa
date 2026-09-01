import * as pdfjsLib from 'pdfjs-dist';
import {
  DetectedTable,
  ExtractedPage,
  ExtractedPDFDocument,
  TableCell,
  TextLine,
  TextSpan,
  ConversionOptions,
} from '../types';

// Ensure PDF.js worker is properly configured for high-speed in-browser parsing
try {
  if (typeof window !== 'undefined') {
    // Use matching version cdnjs worker with local fallback
    const version = pdfjsLib.version || '4.10.38';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('PDF.js worker setup warning:', e);
}

interface RawTextItem {
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[]; // [scaleX, skewY, skewX, scaleY, transX, transY]
  fontName: string;
  hasEOL: boolean;
}

/**
 * Parses a PDF file directly in the browser using PDF.js
 */
export async function extractPDFContent(
  fileOrBuffer: File | ArrayBuffer,
  options: ConversionOptions,
  onProgress?: (progress: number, message: string) => void
): Promise<ExtractedPDFDocument> {
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
  const pages: ExtractedPage[] = [];
  const allTables: DetectedTable[] = [];
  let fullTextCombined = '';

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress) {
      const pct = Math.round(((pageNum - 1) / totalPages) * 70);
      onProgress(pct, `Extracting structure from page ${pageNum} of ${totalPages}...`);
    }

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    // Render low-res thumbnail for fast visual preview
    let thumbnailUrl = '';
    try {
      const thumbViewport = page.getViewport({ scale: 0.5 });
      const canvas = document.createElement('canvas');
      canvas.width = thumbViewport.width;
      canvas.height = thumbViewport.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        await (page.render as (params: Record<string, unknown>) => { promise: Promise<unknown> })({
          canvasContext: ctx,
          viewport: thumbViewport,
          canvas: canvas,
        }).promise;
        thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
      }
    } catch {
      // Thumbnail non-fatal if rendering encounters issue
    }

    // Process raw text items into typed spans
    const rawItems: RawTextItem[] = (textContent.items as RawTextItem[]).filter(
      (item) => item.str && item.str.trim().length > 0
    );

    const spans: TextSpan[] = rawItems.map((item) => {
      const transform = item.transform || [1, 0, 0, 1, 0, 0];
      const x = transform[4];
      const y = viewport.height - transform[5]; // Flip Y for top-to-bottom layout
      const fontSize = Math.abs(transform[0]) || Math.abs(transform[3]) || 12;
      const fontName = item.fontName || '';
      const isBold = /bold|black|heavy|semibold/i.test(fontName);
      const isItalic = /italic|oblique/i.test(fontName);

      return {
        text: item.str,
        x,
        y,
        width: item.width || item.str.length * (fontSize * 0.5),
        height: item.height || fontSize,
        fontSize,
        fontFamily: fontName,
        isBold,
        isItalic,
      };
    });

    // Group spans into logical lines based on Y coordinate tolerance
    const lines = groupSpansIntoLines(spans, viewport.width);

    // Compute median font size on page to detect headings
    const fontSizes = spans.map((s) => s.fontSize).sort((a, b) => a - b);
    const medianFontSize = fontSizes.length > 0 ? fontSizes[Math.floor(fontSizes.length / 2)] : 12;

    // Classify lines (headings, lists, body)
    classifyLines(lines, medianFontSize);

    // Detect tables if enabled
    let pageTables: DetectedTable[] = [];
    if (options.detectTables) {
      pageTables = detectTablesFromLines(lines, pageNum, viewport.width, options.tableSensitivity);
      allTables.push(...pageTables);
    }

    const pageFullText = lines.map((l) => l.text).join('\n');
    fullTextCombined += (fullTextCombined ? '\n\n' : '') + pageFullText;

    pages.push({
      pageNumber: pageNum,
      width: viewport.width,
      height: viewport.height,
      lines,
      tables: pageTables,
      fullText: pageFullText,
      thumbnailUrl,
    });
  }

  // Extract metadata if available
  let metadataObj = undefined;
  try {
    const meta = await pdfDoc.getMetadata();
    if (meta?.info) {
      const info = meta.info as Record<string, string>;
      metadataObj = {
        author: info.Author,
        creator: info.Creator,
        creationDate: info.CreationDate,
      };
    }
  } catch {
    // Ignore metadata reading errors
  }

  return {
    title: (fileOrBuffer instanceof File ? fileOrBuffer.name.replace(/\.pdf$/i, '') : 'Document'),
    totalPages,
    pages,
    allTables,
    fullText: fullTextCombined,
    metadata: metadataObj,
  };
}

/**
 * Groups raw positioned text spans into structured horizontal lines
 */
function groupSpansIntoLines(spans: TextSpan[], pageWidth: number): TextLine[] {
  if (spans.length === 0) return [];

  // Sort top-to-bottom first, then left-to-right
  const sorted = [...spans].sort((a, b) => {
    const yDiff = a.y - b.y;
    if (Math.abs(yDiff) > 4) return yDiff;
    return a.x - b.x;
  });

  const lines: TextLine[] = [];
  let currentSpans: TextSpan[] = [];
  let currentY = sorted[0].y;
  let currentHeight = sorted[0].height;

  for (const span of sorted) {
    if (currentSpans.length === 0) {
      currentSpans.push(span);
      currentY = span.y;
      currentHeight = span.height;
      continue;
    }

    // Check if span is roughly on the same line (within vertical threshold)
    const yThreshold = Math.max(span.fontSize * 0.45, 4);
    if (Math.abs(span.y - currentY) <= yThreshold) {
      currentSpans.push(span);
      currentHeight = Math.max(currentHeight, span.height);
    } else {
      // Finalize current line
      currentSpans.sort((a, b) => a.x - b.x);
      lines.push(buildLineObject(currentSpans, currentY, currentHeight, pageWidth));
      currentSpans = [span];
      currentY = span.y;
      currentHeight = span.height;
    }
  }

  if (currentSpans.length > 0) {
    currentSpans.sort((a, b) => a.x - b.x);
    lines.push(buildLineObject(currentSpans, currentY, currentHeight, pageWidth));
  }

  return lines;
}

function buildLineObject(
  spans: TextSpan[],
  y: number,
  height: number,
  pageWidth: number
): TextLine {
  // Join text with smart spacing if distance between spans is significant
  let lineText = '';
  for (let i = 0; i < spans.length; i++) {
    const s = spans[i];
    if (i > 0) {
      const prev = spans[i - 1];
      const gap = s.x - (prev.x + prev.width);
      if (gap > 3 && !lineText.endsWith(' ') && !s.text.startsWith(' ')) {
        lineText += ' ';
      }
    }
    lineText += s.text;
  }

  // Calculate alignment
  const minX = spans[0].x;
  const lastSpan = spans[spans.length - 1];
  const maxX = lastSpan.x + lastSpan.width;
  const lineCenter = (minX + maxX) / 2;
  const pageCenter = pageWidth / 2;

  let alignment: 'left' | 'center' | 'right' | 'justify' = 'left';
  if (Math.abs(lineCenter - pageCenter) < 25 && minX > 50 && (pageWidth - maxX) > 50) {
    alignment = 'center';
  } else if (pageWidth - maxX < 40 && minX > 150) {
    alignment = 'right';
  }

  return {
    y,
    height,
    spans,
    text: lineText.trim(),
    alignment,
  };
}

/**
 * Classifies lines into headings, list items, or regular text
 */
function classifyLines(lines: TextLine[], medianFontSize: number) {
  for (const line of lines) {
    const text = line.text;
    if (!text) continue;

    // Check for list items
    const listMatch = text.match(/^([\u2022\u25E6\u25AA\u2023\u2219\u00B7\*\-–]|\d+[\.\)]|[a-zA-Z][\.\)])\s+(.*)/);
    if (listMatch) {
      line.isListItem = true;
      line.listMarker = listMatch[1];
    }

    // Check for headings based on font size and weight
    const maxFontSizeInLine = Math.max(...line.spans.map((s) => s.fontSize));
    const isBoldLine = line.spans.every((s) => s.isBold || s.fontSize > medianFontSize * 1.15);

    if (maxFontSizeInLine >= medianFontSize * 1.7) {
      line.isHeading = true;
      line.headingLevel = 1;
    } else if (maxFontSizeInLine >= medianFontSize * 1.35) {
      line.isHeading = true;
      line.headingLevel = 2;
    } else if (maxFontSizeInLine >= medianFontSize * 1.15 && (isBoldLine || line.text.length < 60)) {
      line.isHeading = true;
      line.headingLevel = 3;
    }
  }
}

/**
 * Detects tabular structures across lines
 */
function detectTablesFromLines(
  lines: TextLine[],
  pageNumber: number,
  pageWidth: number,
  sensitivity: 'low' | 'medium' | 'high'
): DetectedTable[] {
  const tables: DetectedTable[] = [];
  const minCols = sensitivity === 'high' ? 2 : 2;
  const gapThreshold = sensitivity === 'low' ? 30 : sensitivity === 'high' ? 14 : 20;

  // Identify lines that look like table rows (multiple distinct horizontal clusters)
  interface RowCandidate {
    lineIndex: number;
    line: TextLine;
    cells: { x: number; width: number; text: string }[];
  }

  const rowCandidates: RowCandidate[] = [];

  lines.forEach((line, idx) => {
    if (line.spans.length < 2) return;
    if (line.isHeading && line.headingLevel && line.headingLevel <= 2) return;

    // Cluster spans into table cells by looking for significant horizontal gaps
    const cells: { x: number; width: number; text: string }[] = [];
    let currentCell = {
      x: line.spans[0].x,
      width: line.spans[0].width,
      text: line.spans[0].text,
    };

    for (let i = 1; i < line.spans.length; i++) {
      const span = line.spans[i];
      const gap = span.x - (currentCell.x + currentCell.width);

      if (gap >= gapThreshold) {
        cells.push({ ...currentCell });
        currentCell = {
          x: span.x,
          width: span.width,
          text: span.text,
        };
      } else {
        currentCell.text += (currentCell.text.endsWith(' ') ? '' : ' ') + span.text;
        currentCell.width = span.x + span.width - currentCell.x;
      }
    }
    cells.push(currentCell);

    if (cells.length >= minCols) {
      rowCandidates.push({ lineIndex: idx, line, cells });
    }
  });

  if (rowCandidates.length === 0) return tables;

  // Group contiguous or closely aligned row candidates into table blocks
  let currentGroup: RowCandidate[] = [];

  for (let i = 0; i < rowCandidates.length; i++) {
    const cand = rowCandidates[i];

    if (currentGroup.length === 0) {
      currentGroup.push(cand);
      continue;
    }

    const prevCand = currentGroup[currentGroup.length - 1];
    const verticalGap = cand.line.y - prevCand.line.y;

    // Rows must be vertically close (within reasonable line height) and line indices close
    const isAdjacent = (cand.lineIndex - prevCand.lineIndex <= 2) && (verticalGap < 45);

    if (isAdjacent) {
      currentGroup.push(cand);
    } else {
      if (currentGroup.length >= 2) {
        const table = buildDetectedTable(currentGroup, pageNumber, pageWidth);
        if (table) tables.push(table);
      }
      currentGroup = [cand];
    }
  }

  if (currentGroup.length >= 2) {
    const table = buildDetectedTable(currentGroup, pageNumber, pageWidth);
    if (table) tables.push(table);
  }

  return tables;
}

/**
 * Builds a structured DetectedTable with aligned columns and data type parsing
 */
function buildDetectedTable(
  rows: { lineIndex: number; line: TextLine; cells: { x: number; width: number; text: string }[] }[],
  pageNumber: number,
  pageWidth: number
): DetectedTable | null {
  if (rows.length < 2) return null;

  // Find unique column boundaries by clustering X coordinates
  const allXPositions: number[] = [];
  rows.forEach((r) => r.cells.forEach((c) => allXPositions.push(c.x)));
  allXPositions.sort((a, b) => a - b);

  // Cluster column start positions with a 25px tolerance
  const columnStarts: number[] = [];
  for (const x of allXPositions) {
    const existing = columnStarts.find((colX) => Math.abs(colX - x) < 25);
    if (existing === undefined) {
      columnStarts.push(x);
    }
  }
  columnStarts.sort((a, b) => a - b);

  if (columnStarts.length < 2) return null;

  // Map each row's cells to the detected columns
  const rawGrid: string[][] = [];
  const tableRows: TableCell[][] = [];

  for (let rIdx = 0; rIdx < rows.length; rIdx++) {
    const row = rows[rIdx];
    const gridRow: string[] = new Array(columnStarts.length).fill('');
    const cellRow: TableCell[] = new Array(columnStarts.length);

    for (const cell of row.cells) {
      // Find closest column start
      let closestCol = 0;
      let minDiff = Infinity;
      columnStarts.forEach((colX, colIdx) => {
        const diff = Math.abs(cell.x - colX);
        if (diff < minDiff) {
          minDiff = diff;
          closestCol = colIdx;
        }
      });

      if (gridRow[closestCol]) {
        gridRow[closestCol] += ' ' + cell.text.trim();
      } else {
        gridRow[closestCol] = cell.text.trim();
      }
    }

    const isHeaderRow = rIdx === 0;

    for (let c = 0; c < columnStarts.length; c++) {
      const rawVal = gridRow[c] || '';
      const parsedNum = parseNumericValue(rawVal);
      const isNum = parsedNum !== null;

      cellRow[c] = {
        text: rawVal,
        isHeader: isHeaderRow,
        align: isNum ? 'right' : 'left',
        numericValue: parsedNum,
      };
    }

    rawGrid.push(gridRow);
    tableRows.push(cellRow);
  }

  // Extract header names
  const headers = rawGrid[0] || [];

  const minY = Math.min(...rows.map((r) => r.line.y));
  const maxY = Math.max(...rows.map((r) => r.line.y + r.line.height));
  const minX = Math.min(...columnStarts);

  return {
    id: `table_p${pageNumber}_${Math.random().toString(36).substring(2, 7)}`,
    pageNumber,
    headers,
    rows: tableRows,
    rawGrid,
    bounds: {
      x: minX,
      y: minY,
      width: pageWidth - minX - 40,
      height: maxY - minY,
    },
  };
}

/**
 * Attempts to parse currency, percentages, or numbers from cell strings
 */
function parseNumericValue(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[$€£¥,%\s]/g, '').trim();
  if (!cleaned) return null;
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}
