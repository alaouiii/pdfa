export type ConversionFormat = 'docx' | 'xlsx' | 'png' | 'jpg' | 'webp' | 'both' | 'all';

export type OutputMode = 'structured' | 'tables_only' | 'text_flow';

export interface ConvertedPageImage {
  pageNumber: number;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  format: 'png' | 'jpg' | 'webp';
  size: number;
}

export interface ConversionOptions {
  format: ConversionFormat;
  includeImages: boolean;
  detectTables: boolean;
  tableSensitivity: 'low' | 'medium' | 'high';
  preservePageBreaks: boolean;
  excelSheetMode: 'auto_tables' | 'per_page' | 'single_master';
  numberFormatting: boolean;
  imageScale: number; // 1 = 72dpi, 2 = 144-200dpi, 3 = 300dpi
  imageQuality: number; // 0.7 to 1.0 for JPG/WebP
  bundleMultiPageZip: boolean;
}

export interface TextSpan {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
  color?: string;
}

export interface TextLine {
  y: number;
  height: number;
  spans: TextSpan[];
  text: string;
  isHeading?: boolean;
  headingLevel?: 1 | 2 | 3;
  isListItem?: boolean;
  listMarker?: string;
  alignment: 'left' | 'center' | 'right' | 'justify';
}

export interface TableCell {
  text: string;
  colSpan?: number;
  rowSpan?: number;
  isHeader?: boolean;
  align?: 'left' | 'center' | 'right';
  numericValue?: number | null;
}

export interface DetectedTable {
  id: string;
  pageNumber: number;
  title?: string;
  headers: string[];
  rows: TableCell[][];
  rawGrid: string[][];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ExtractedPage {
  pageNumber: number;
  width: number;
  height: number;
  lines: TextLine[];
  tables: DetectedTable[];
  fullText: string;
  thumbnailUrl?: string;
}

export interface ExtractedPDFDocument {
  title: string;
  totalPages: number;
  pages: ExtractedPage[];
  allTables: DetectedTable[];
  fullText: string;
  metadata?: {
    author?: string;
    creator?: string;
    creationDate?: string;
  };
}

export type ProcessingStatus = 'idle' | 'parsing' | 'converting' | 'completed' | 'error';

export interface ConvertedOutput {
  docxBlob?: Blob;
  docxSize?: number;
  xlsxBlob?: Blob;
  xlsxSize?: number;
  pngBlob?: Blob;
  pngSize?: number;
  pngPages?: ConvertedPageImage[];
  jpgBlob?: Blob;
  jpgSize?: number;
  jpgPages?: ConvertedPageImage[];
  webpBlob?: Blob;
  webpSize?: number;
  webpPages?: ConvertedPageImage[];
  timeTakenMs: number;
}

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  totalPages?: number;
  status: ProcessingStatus;
  progress: number; // 0 - 100
  statusMessage?: string;
  error?: string;
  extractedDoc?: ExtractedPDFDocument;
  output?: ConvertedOutput;
  selectedFormat: ConversionFormat;
  customOptions: ConversionOptions;
}
