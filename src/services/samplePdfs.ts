/**
 * Generates valid standard PDF 1.4 binary files for instant 1-click testing
 */

export interface SamplePDFInfo {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'document' | 'catalog';
  pages: number;
}

export const SAMPLE_PDFS: SamplePDFInfo[] = [
  {
    id: 'financial_report',
    name: 'Q4_Financial_Report_&_Invoice.pdf',
    description: 'Corporate financial statement with multi-column revenue tables, totals, and bullet notes.',
    category: 'financial',
    pages: 2,
  },
  {
    id: 'product_catalog',
    name: 'Product_Inventory_&_Pricing_Sheet.pdf',
    description: 'Inventory matrix with SKU codes, category breakdown, unit costs, and profit margins.',
    category: 'catalog',
    pages: 1,
  },
  {
    id: 'executive_doc',
    name: 'Project_Specification_&_Milestones.pdf',
    description: 'Document with structured headings, timeline deliverables table, and executive summary.',
    category: 'document',
    pages: 2,
  },
];

export function generateSamplePDF(sampleId: string): File {
  let pdfBytes: Uint8Array;
  let filename = 'sample.pdf';

  switch (sampleId) {
    case 'financial_report':
      filename = 'Q4_Financial_Report_&_Invoice.pdf';
      pdfBytes = createFinancialPdfBinary();
      break;
    case 'product_catalog':
      filename = 'Product_Inventory_&_Pricing_Sheet.pdf';
      pdfBytes = createCatalogPdfBinary();
      break;
    case 'executive_doc':
    default:
      filename = 'Project_Specification_&_Milestones.pdf';
      pdfBytes = createProjectDocPdfBinary();
      break;
  }

  return new File([pdfBytes], filename, { type: 'application/pdf' });
}

/**
 * Creates raw valid PDF 1.4 binary containing structured text, headings, and aligned tabular columns
 */
function createFinancialPdfBinary(): Uint8Array {
  const page1Content = `
BT
/F1 18 Tf
50 740 Td
(ACME GLOBAL CORPORATION - Q4 FINANCIAL REPORT) Tj
/F2 10 Tf
0 -18 Td
(Fiscal Year 2026 | Generated: December 31, 2026 | Confidential) Tj
/F1 14 Tf
0 -30 Td
(1. Executive Financial Summary) Tj
/F2 11 Tf
0 -18 Td
(During the fourth quarter, global consolidated revenue reached record growth across enterprise software) Tj
0 -14 Td
(and cloud infrastructure services. Operating margins improved by 4.2% year-over-year.) Tj
/F1 13 Tf
0 -26 Td
(2. Quarterly Revenue & Expenditure Breakdown) Tj
/F1 10 Tf
50 580 Td (Department) Tj
180 580 Td (Q3 Actual ($)) Tj
290 580 Td (Q4 Target ($)) Tj
400 580 Td (Q4 Actual ($)) Tj
490 580 Td (Variance) Tj
/F2 10 Tf
50 560 Td (Cloud Engineering) Tj
180 560 Td (1,450,000.00) Tj
290 560 Td (1,600,000.00) Tj
400 560 Td (1,685,420.00) Tj
490 560 Td (+5.3%) Tj
50 540 Td (Enterprise Sales) Tj
180 540 Td (2,120,500.00) Tj
290 540 Td (2,300,000.00) Tj
400 540 Td (2,450,110.00) Tj
490 540 Td (+6.5%) Tj
50 520 Td (Product & Design) Tj
180 520 Td (680,000.00) Tj
290 520 Td (720,000.00) Tj
400 520 Td (715,300.00) Tj
490 520 Td (-0.7%) Tj
50 500 Td (Operations & Support) Tj
180 500 Td (430,200.00) Tj
290 500 Td (450,000.00) Tj
400 500 Td (442,800.00) Tj
490 500 Td (-1.6%) Tj
/F1 10 Tf
50 480 Td (Total Consolidated) Tj
180 480 Td (4,680,700.00) Tj
290 480 Td (5,070,000.00) Tj
400 480 Td (5,293,630.00) Tj
490 480 Td (+4.4%) Tj
/F1 13 Tf
50 430 Td
(3. Strategic Action Items for Next Quarter) Tj
/F2 10 Tf
50 405 Td
(* Expand European region data centers to reduce latency by 35ms) Tj
50 385 Td
(* Onboard 15 senior enterprise solution architects before February) Tj
50 365 Td
(* Complete SOC2 Type II compliance audit and ISO 27001 renewal) Tj
ET
`;

  const page2Content = `
BT
/F1 16 Tf
50 740 Td
(COMMERCIAL INVOICE & BILLING DETAILS) Tj
/F2 10 Tf
0 -18 Td
(Invoice #: INV-2026-8894 | Bill To: Horizon Enterprises Ltd | Payment Terms: Net 30) Tj
/F1 12 Tf
0 -30 Td
(Itemized Billing Matrix) Tj
/F1 10 Tf
50 640 Td (Item #) Tj
110 640 Td (Description) Tj
280 640 Td (Qty) Tj
350 640 Td (Unit Rate ($)) Tj
440 640 Td (Tax Rate) Tj
500 640 Td (Total ($)) Tj
/F2 10 Tf
50 620 Td (SKU-101) Tj
110 620 Td (Dedicated Cloud Compute Node) Tj
280 620 Td (12) Tj
350 620 Td (450.00) Tj
440 620 Td (5.0%) Tj
500 620 Td (5,400.00) Tj
50 600 Td (SKU-104) Tj
110 600 Td (Enterprise Support SLA 24/7) Tj
280 600 Td (1) Tj
350 600 Td (1,200.00) Tj
440 600 Td (5.0%) Tj
500 600 Td (1,200.00) Tj
50 580 Td (SKU-109) Tj
110 580 Td (SSD High-Throughput Storage) Tj
280 580 Td (50) Tj
350 580 Td (28.50) Tj
440 580 Td (5.0%) Tj
500 580 Td (1,425.00) Tj
50 560 Td (SKU-205) Tj
110 560 Td (Custom Security Gateway Setup) Tj
280 560 Td (1) Tj
350 560 Td (850.00) Tj
440 580 Td (5.0%) Tj
500 560 Td (850.00) Tj
/F1 10 Tf
50 530 Td (Subtotal Amount:) Tj
480 530 Td (8,875.00) Tj
50 510 Td (Applicable Sales Tax (5%):) Tj
480 510 Td (443.75) Tj
50 490 Td (Grand Total Payable:) Tj
480 490 Td ($9,318.75) Tj
ET
`;

  return buildMultiPagePdf([page1Content, page2Content]);
}

function createCatalogPdfBinary(): Uint8Array {
  const pageContent = `
BT
/F1 18 Tf
50 740 Td
(PRODUCT INVENTORY & PRICING MATRIX 2026) Tj
/F2 10 Tf
0 -18 Td
(Warehouse: Central Hub 4 | Category: Electronics & Industrial Equipment) Tj
/F1 10 Tf
50 660 Td (SKU) Tj
120 660 Td (Product Name) Tj
250 660 Td (Category) Tj
340 660 Td (Stock) Tj
400 660 Td (Cost ($)) Tj
460 660 Td (Price ($)) Tj
520 660 Td (Margin) Tj
/F2 10 Tf
50 635 Td (EL-901) Tj
120 635 Td (Industrial Sensor Pro) Tj
250 635 Td (Sensors) Tj
340 635 Td (450) Tj
400 635 Td (34.50) Tj
460 635 Td (69.99) Tj
520 635 Td (50.7%) Tj
50 610 Td (EL-904) Tj
120 610 Td (Wireless Gateway V2) Tj
250 610 Td (Networking) Tj
340 610 Td (180) Tj
400 610 Td (82.00) Tj
460 610 Td (149.00) Tj
520 610 Td (45.0%) Tj
50 585 Td (EL-910) Tj
120 585 Td (Power Relays 24V DC) Tj
250 585 Td (Components) Tj
340 585 Td (1200) Tj
400 585 Td (4.20) Tj
460 585 Td (9.50) Tj
520 585 Td (55.8%) Tj
50 560 Td (EL-933) Tj
120 560 Td (Micro Controller Board) Tj
250 560 Td (Controllers) Tj
340 560 Td (620) Tj
400 560 Td (18.75) Tj
460 560 Td (38.00) Tj
520 560 Td (50.7%) Tj
50 535 Td (EL-950) Tj
120 535 Td (Optic Fiber Cable 10m) Tj
250 535 Td (Cables) Tj
340 535 Td (310) Tj
400 535 Td (12.00) Tj
460 535 Td (24.99) Tj
520 535 Td (52.0%) Tj
/F1 12 Tf
50 470 Td
(Inventory Replenishment Notes) Tj
/F2 10 Tf
50 445 Td
(* Minimum re-order threshold set to 150 units across all networking items) Tj
50 425 Td
(* Lead times for micro-controller components estimated at 12 business days) Tj
ET
`;

  return buildMultiPagePdf([pageContent]);
}

function createProjectDocPdfBinary(): Uint8Array {
  const page1Content = `
BT
/F1 18 Tf
50 740 Td
(PROJECT ALPHA: TECHNICAL SPECIFICATION) Tj
/F2 10 Tf
0 -18 Td
(Lead Architect: Sarah Jenkins | Version: 2.4 | Status: Approved for Development) Tj
/F1 14 Tf
0 -30 Td
(1. System Overview and Goals) Tj
/F2 10 Tf
0 -18 Td
(The purpose of Project Alpha is to construct a resilient, high-throughput data pipeline) Tj
0 -14 Td
(capable of processing 25,000 events per second with sub-50ms latency across multi-cloud regions.) Tj
/F1 14 Tf
0 -30 Td
(2. Key Deliverables & Milestone Schedule) Tj
/F1 10 Tf
50 560 Td (Phase) Tj
120 560 Td (Milestone Name) Tj
270 560 Td (Target Date) Tj
370 560 Td (Owner) Tj
460 560 Td (Deliverable Status) Tj
/F2 10 Tf
50 535 Td (Phase 1) Tj
120 535 Td (Core Architecture Blueprint) Tj
270 535 Td (Jan 15, 2026) Tj
370 535 Td (S. Jenkins) Tj
460 535 Td (Completed) Tj
50 510 Td (Phase 2) Tj
120 510 Td (Database Partitioning & Sharding) Tj
270 510 Td (Feb 28, 2026) Tj
370 510 Td (M. Chen) Tj
460 510 Td (In Progress) Tj
50 485 Td (Phase 3) Tj
120 485 Td (API Gateway & Auth Integration) Tj
270 485 Td (Mar 30, 2026) Tj
370 510 Td (D. Vance) Tj
460 485 Td (Pending) Tj
50 460 Td (Phase 4) Tj
120 460 Td (Load Testing & Chaos Engineering) Tj
270 460 Td (Apr 20, 2026) Tj
370 460 Td (Q/A Team) Tj
460 460 Td (Scheduled) Tj
ET
`;

  return buildMultiPagePdf([page1Content]);
}

/**
 * Encodes text stream into standard PDF 1.4 objects
 */
function buildMultiPagePdf(pagesStreams: string[]): Uint8Array {
  const encoder = new TextEncoder();
  const numPages = pagesStreams.length;

  let out = '%PDF-1.4\n';
  const offsets: number[] = [];

  // Object 1: Catalog
  offsets.push(out.length);
  out += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';

  // Object 2: Pages container
  offsets.push(out.length);
  const pageRefs = pagesStreams.map((_, i) => `${4 + i * 2} 0 R`).join(' ');
  out += `2 0 obj\n<< /Type /Pages /Kids [${pageRefs}] /Count ${numPages} >>\nendobj\n`;

  // Object 3: Font descriptors
  offsets.push(out.length);
  out += '3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n';

  // Object for regular font
  const regFontObj = 3 + numPages * 2 + 1;

  // For each page, create Page obj and Content Stream obj
  pagesStreams.forEach((content, i) => {
    const pageObjNum = 4 + i * 2;
    const contentObjNum = pageObjNum + 1;

    // Page object
    offsets.push(out.length);
    out += `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents ${contentObjNum} 0 R /Resources << /Font << /F1 3 0 R /F2 ${regFontObj} 0 R >> >> >>\nendobj\n`;

    // Content Stream
    const cleanContent = content.trim();
    offsets.push(out.length);
    out += `${contentObjNum} 0 obj\n<< /Length ${cleanContent.length} >>\nstream\n${cleanContent}\nendstream\nendobj\n`;
  });

  // Regular Font object
  offsets.push(out.length);
  out += `${regFontObj} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  // Cross-reference table
  const startXref = out.length;
  out += `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((offset) => {
    out += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  });

  out += `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return encoder.encode(out);
}
