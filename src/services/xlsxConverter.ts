import * as XLSX from 'xlsx';
import { ConversionOptions, ExtractedPDFDocument, DetectedTable } from '../types';

/**
 * Converts an ExtractedPDFDocument into a Microsoft Excel (.xlsx) workbook
 */
export async function convertToXlsx(
  doc: ExtractedPDFDocument,
  options: ConversionOptions,
  onProgress?: (pct: number, message: string) => void
): Promise<Blob> {
  if (onProgress) onProgress(80, 'Constructing Excel (.xlsx) worksheets & tables...');

  const workbook = XLSX.utils.book_new();
  const sheetMode = options.excelSheetMode || 'auto_tables';

  if (sheetMode === 'auto_tables' && doc.allTables.length > 0) {
    // 1. Create a dedicated sheet for each detected table
    doc.allTables.forEach((table, idx) => {
      const sheetData = createTableSheetData(table, options);
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      autoFitColumns(worksheet, sheetData);

      const sheetName = sanitizeSheetName(
        `Table ${idx + 1} (Pg ${table.pageNumber})`
      );
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    // 2. Add an Overview / All Data sheet
    const masterData = createAllPagesSheetData(doc, options);
    const masterWorksheet = XLSX.utils.aoa_to_sheet(masterData);
    autoFitColumns(masterWorksheet, masterData);
    XLSX.utils.book_append_sheet(workbook, masterWorksheet, 'Full Extracted Data');
  } else if (sheetMode === 'per_page') {
    // Page by page sheets
    doc.pages.forEach((page) => {
      const pageData = createSinglePageSheetData(page, options);
      const worksheet = XLSX.utils.aoa_to_sheet(pageData);
      autoFitColumns(worksheet, pageData);

      const sheetName = sanitizeSheetName(`Page ${page.pageNumber}`);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
  } else {
    // Single consolidated master sheet
    const masterData = createAllPagesSheetData(doc, options);
    const masterWorksheet = XLSX.utils.aoa_to_sheet(masterData);
    autoFitColumns(masterWorksheet, masterData);
    XLSX.utils.book_append_sheet(workbook, masterWorksheet, 'Extracted Content');
  }

  // Fallback if workbook is somehow empty
  if (workbook.SheetNames.length === 0) {
    const defaultData = doc.pages.map((p) => [ `Page ${p.pageNumber}`, p.fullText ]);
    const fallbackSheet = XLSX.utils.aoa_to_sheet(defaultData);
    XLSX.utils.book_append_sheet(workbook, fallbackSheet, 'Extracted Text');
  }

  if (onProgress) onProgress(92, 'Serializing Excel (.xlsx) binary stream...');

  // Generate binary output
  const wbout = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    compression: true,
  });

  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function createTableSheetData(table: DetectedTable, options: ConversionOptions): (string | number)[][] {
  const data: (string | number)[][] = [];

  // Table Title / Page info
  data.push([`Detected Table from Page ${table.pageNumber}`]);
  data.push([]); // blank row

  table.rows.forEach((row) => {
    const rowData: (string | number)[] = [];
    row.forEach((cell) => {
      if (options.numberFormatting && cell.numericValue !== null && cell.numericValue !== undefined && !cell.isHeader) {
        rowData.push(cell.numericValue);
      } else {
        rowData.push(cell.text || '');
      }
    });
    data.push(rowData);
  });

  return data;
}

function createSinglePageSheetData(page: ExtractedPDFDocument['pages'][0], options: ConversionOptions): (string | number)[][] {
  const data: (string | number)[][] = [];

  // If page has tables, render tables formatted
  if (page.tables.length > 0) {
    page.tables.forEach((table, tIdx) => {
      if (tIdx > 0) data.push([]);
      data.push([`--- Table ${tIdx + 1} ---`]);
      table.rows.forEach((row) => {
        const rowData: (string | number)[] = [];
        row.forEach((cell) => {
          if (options.numberFormatting && cell.numericValue !== null && cell.numericValue !== undefined && !cell.isHeader) {
            rowData.push(cell.numericValue);
          } else {
            rowData.push(cell.text || '');
          }
        });
        data.push(rowData);
      });
    });
    data.push([]);
  }

  // Also include text lines that weren't captured in tables
  data.push(['--- Raw Text Lines ---']);
  page.lines.forEach((line) => {
    // Split line spans if multi-column
    if (line.spans.length > 1) {
      data.push(line.spans.map((s) => s.text));
    } else {
      data.push([line.text]);
    }
  });

  return data;
}

function createAllPagesSheetData(doc: ExtractedPDFDocument, options: ConversionOptions): (string | number)[][] {
  const data: (string | number)[][] = [];

  data.push(['Document Title:', doc.title]);
  data.push(['Total Pages:', doc.totalPages]);
  data.push(['Total Detected Tables:', doc.allTables.length]);
  data.push([]);

  // Add all detected tables first
  if (doc.allTables.length > 0) {
    data.push(['=== DETECTED TABULAR DATA ===']);
    data.push([]);

    doc.allTables.forEach((table, idx) => {
      data.push([`Table #${idx + 1} (Page ${table.pageNumber})`]);
      table.rows.forEach((row) => {
        const rowData: (string | number)[] = [];
        row.forEach((cell) => {
          if (options.numberFormatting && cell.numericValue !== null && cell.numericValue !== undefined && !cell.isHeader) {
            rowData.push(cell.numericValue);
          } else {
            rowData.push(cell.text || '');
          }
        });
        data.push(rowData);
      });
      data.push([]);
    });
  }

  // Append full document lines structured
  data.push(['=== FULL DOCUMENT TEXT CONTENT ===']);
  data.push([]);

  doc.pages.forEach((page) => {
    data.push([`--- Page ${page.pageNumber} ---`]);
    page.lines.forEach((line) => {
      if (line.spans.length > 1) {
        data.push(line.spans.map((s) => s.text));
      } else {
        data.push([line.text]);
      }
    });
    data.push([]);
  });

  return data;
}

/**
 * Calculates optimal column widths based on cell text lengths
 */
function autoFitColumns(worksheet: XLSX.WorkSheet, data: (string | number)[][]) {
  const colWidths: number[] = [];

  data.forEach((row) => {
    row.forEach((val, colIdx) => {
      const len = val !== null && val !== undefined ? String(val).length : 0;
      colWidths[colIdx] = Math.max(colWidths[colIdx] || 10, len + 3);
    });
  });

  worksheet['!cols'] = colWidths.map((w) => ({
    wch: Math.min(Math.max(w, 10), 60), // clamp width between 10 and 60 chars
  }));
}

/**
 * Ensures sheet names adhere to Excel's 31-character limit and forbidden character rules
 */
function sanitizeSheetName(name: string): string {
  const sanitized = name.replace(/[\\/?*[\]:]/g, '_').trim();
  return sanitized.length > 31 ? sanitized.substring(0, 31) : sanitized;
}
