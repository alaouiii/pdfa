import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
} from 'docx';
import { ConversionOptions, ExtractedPDFDocument, DetectedTable, TextLine } from '../types';

/**
 * Converts an ExtractedPDFDocument into a genuine Microsoft Word (.docx) document
 */
export async function convertToDocx(
  doc: ExtractedPDFDocument,
  options: ConversionOptions,
  onProgress?: (pct: number, message: string) => void
): Promise<Blob> {
  if (onProgress) onProgress(75, 'Generating Microsoft Word (.docx) layout...');

  const children: (Paragraph | Table)[] = [];

  for (let pIdx = 0; pIdx < doc.pages.length; pIdx++) {
    const page = doc.pages[pIdx];

    // Identify which lines belong to detected tables to avoid duplicating text
    const tableLineRanges = new Set<number>();
    if (options.detectTables && page.tables.length > 0) {
      // Group lines by table bounds
      page.tables.forEach((table) => {
        page.lines.forEach((line, lIdx) => {
          if (line.y >= table.bounds.y - 5 && line.y <= table.bounds.y + table.bounds.height + 5) {
            tableLineRanges.add(lIdx);
          }
        });
      });
    }

    let currentTableIdx = 0;

    for (let lIdx = 0; lIdx < page.lines.length; lIdx++) {
      const line = page.lines[lIdx];

      // If this line is the start of a detected table, insert the table!
      if (options.detectTables && currentTableIdx < page.tables.length) {
        const nextTable = page.tables[currentTableIdx];
        if (Math.abs(line.y - nextTable.bounds.y) < 15) {
          const docxTable = createDocxTable(nextTable);
          children.push(docxTable);
          // Add spacing after table
          children.push(new Paragraph({ spacing: { after: 200 } }));
          currentTableIdx++;
        }
      }

      // If line is part of a table, skip printing as standalone paragraph
      if (tableLineRanges.has(lIdx)) {
        continue;
      }

      // Convert normal text line
      const paragraph = createDocxParagraph(line);
      if (paragraph) {
        children.push(paragraph);
      }
    }

    // Insert any remaining tables on the page that weren't captured by Y position
    while (currentTableIdx < page.tables.length) {
      const remainingTable = page.tables[currentTableIdx];
      children.push(createDocxTable(remainingTable));
      children.push(new Paragraph({ spacing: { after: 200 } }));
      currentTableIdx++;
    }

    // Add page break if requested and not last page
    if (options.preservePageBreaks && pIdx < doc.pages.length - 1) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '' })],
          pageBreakBefore: true,
        })
      );
    }
  }

  // Build full Document
  const docxDocument = new Document({
    title: doc.title,
    creator: 'Fast PDF Converter (100% In-Browser)',
    description: `Converted from PDF: ${doc.title}`,
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22, // 11pt
            color: '1F2937',
          },
          paragraph: {
            spacing: {
              line: 276, // 1.15 line spacing
              after: 120,
            },
          },
        },
        heading1: {
          run: {
            font: 'Calibri',
            size: 36, // 18pt
            bold: true,
            color: '0F172A',
          },
          paragraph: {
            spacing: { before: 300, after: 150 },
          },
        },
        heading2: {
          run: {
            font: 'Calibri',
            size: 28, // 14pt
            bold: true,
            color: '1E293B',
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
          },
        },
        heading3: {
          run: {
            font: 'Calibri',
            size: 24, // 12pt
            bold: true,
            color: '334155',
          },
          paragraph: {
            spacing: { before: 180, after: 90 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: children.length > 0 ? children : [new Paragraph({ text: doc.fullText || 'Empty Document' })],
      },
    ],
  });

  if (onProgress) onProgress(90, 'Packing Word (.docx) binary package...');
  const blob = await Packer.toBlob(docxDocument);
  return blob;
}

function createDocxParagraph(line: TextLine): Paragraph | null {
  if (!line.text.trim()) return null;

  let heading: (typeof HeadingLevel)[keyof typeof HeadingLevel] | undefined = undefined;
  if (line.isHeading) {
    if (line.headingLevel === 1) heading = HeadingLevel.HEADING_1;
    else if (line.headingLevel === 2) heading = HeadingLevel.HEADING_2;
    else heading = HeadingLevel.HEADING_3;
  }

  let alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT;
  if (line.alignment === 'center') alignment = AlignmentType.CENTER;
  else if (line.alignment === 'right') alignment = AlignmentType.RIGHT;
  else if (line.alignment === 'justify') alignment = AlignmentType.BOTH;

  // Build runs from spans
  const runs: TextRun[] = [];
  let prevText = '';

  for (let i = 0; i < line.spans.length; i++) {
    const span = line.spans[i];
    let spanText = span.text;

    // Add space if needed
    if (i > 0) {
      const prev = line.spans[i - 1];
      const gap = span.x - (prev.x + prev.width);
      if (gap > 3 && !prevText.endsWith(' ') && !spanText.startsWith(' ')) {
        spanText = ' ' + spanText;
      }
    }

    prevText = spanText;

    runs.push(
      new TextRun({
        text: spanText,
        bold: span.isBold || (line.isHeading ?? false),
        italics: span.isItalic,
        size: Math.round(span.fontSize * 2), // docx uses half-points
        font: 'Calibri',
      })
    );
  }

  return new Paragraph({
    children: runs.length > 0 ? runs : [new TextRun({ text: line.text })],
    heading,
    alignment,
    bullet: line.isListItem ? { level: 0 } : undefined,
    spacing: {
      after: line.isHeading ? 140 : 80,
      before: line.isHeading ? 200 : 0,
    },
  });
}

function createDocxTable(detectedTable: DetectedTable): Table {
  const tableRows: TableRow[] = [];

  const thinBorder = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: 'D1D5DB', // light gray border
  };

  const bordersConfig = {
    top: thinBorder,
    bottom: thinBorder,
    left: thinBorder,
    right: thinBorder,
  };

  detectedTable.rows.forEach((row, rowIdx) => {
    const isHeader = rowIdx === 0;

    const cells: TableCell[] = row.map((cell) => {
      let align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT;
      if (cell.align === 'center') align = AlignmentType.CENTER;
      if (cell.align === 'right') align = AlignmentType.RIGHT;

      return new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: cell.text || ' ',
                bold: isHeader,
                size: isHeader ? 21 : 19, // 10.5pt or 9.5pt
                color: isHeader ? '0F172A' : '334155',
              }),
            ],
            alignment: align,
            spacing: { before: 40, after: 40 },
          }),
        ],
        shading: isHeader
          ? {
              fill: 'F1F5F9', // subtle cool slate header
              type: ShadingType.CLEAR,
            }
          : undefined,
        margins: {
          top: 100,
          bottom: 100,
          left: 140,
          right: 140,
        },
        borders: bordersConfig,
      });
    });

    tableRows.push(
      new TableRow({
        children: cells,
        tableHeader: isHeader,
      })
    );
  });

  return new Table({
    rows: tableRows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: bordersConfig,
  });
}
