import PDFDocument from "pdfkit";
import fsSync from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { resolveStoredFilePath } from "../utils/fileCleanup.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, "..", "assets", "logo.png");

const PAGE_MARGIN = 50;
const COLORS = {
  brand: "#02B833",
  dark: "#0f172a",
  muted: "#64748b",
  border: "#d9e2ec",
  headerBg: "#ecfdf3",
  zebraBg: "#f8fafc",
};

const ensureSpace = (doc, neededHeight) => {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + neededHeight > bottom) {
    doc.addPage();
  }
};

const drawDocumentHeader = (doc, { reportTitle, generatedFor }) => {
  const startY = doc.y;
  if (fsSync.existsSync(LOGO_PATH)) {
    try {
      doc.image(LOGO_PATH, PAGE_MARGIN, startY, { width: 42, height: 42 });
    } catch {
      // Corrupt/unreadable logo file should never block the export itself.
    }
  }

  doc
    .fillColor(COLORS.dark)
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("SmartFit Hospital Management System", PAGE_MARGIN + 54, startY, { continued: false });

  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(10)
    .text("Confidential — Personal Data Export", PAGE_MARGIN + 54, startY + 22);

  doc.moveDown(2.2);
  doc.x = PAGE_MARGIN;

  doc
    .moveTo(PAGE_MARGIN, doc.y)
    .lineTo(doc.page.width - PAGE_MARGIN, doc.y)
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .stroke();
  doc.moveDown(0.8);

  doc.fillColor(COLORS.dark).font("Helvetica-Bold").fontSize(15).text(reportTitle);
  doc.moveDown(0.4);

  doc.font("Helvetica").fontSize(10).fillColor(COLORS.muted);
  doc.text(`Generated for: ${generatedFor.name} (${generatedFor.role})`);
  if (generatedFor.identifier) doc.text(`Account: ${generatedFor.identifier}`);
  doc.text(`Generated on: ${new Date().toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}`);
  doc.moveDown(1);
};

const drawFooter = (doc, pageNumber, pageCount) => {
  const bottom = doc.page.height - doc.page.margins.bottom + 12;
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(8)
    .text(
      "SmartFit Hospital Management System — Confidential patient/account data. Generated via self-service data export.",
      PAGE_MARGIN,
      bottom,
      { width: doc.page.width - PAGE_MARGIN * 2 - 80, lineBreak: false }
    );
  doc.text(`Page ${pageNumber} of ${pageCount}`, doc.page.width - PAGE_MARGIN - 80, bottom, {
    width: 80,
    align: "right",
    lineBreak: false,
  });
};

const sectionHeading = (doc, text) => {
  ensureSpace(doc, 34);
  doc.moveDown(0.6);
  const y = doc.y;
  doc.rect(PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, 22).fill(COLORS.headerBg);
  doc
    .fillColor(COLORS.dark)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(text, PAGE_MARGIN + 8, y + 5);
  doc.y = y + 30;
  doc.x = PAGE_MARGIN;
};

const keyValueBlock = (doc, rows) => {
  const labelWidth = 160;
  const valueWidth = doc.page.width - PAGE_MARGIN * 2 - labelWidth;
  for (const [label, value] of rows) {
    const displayValue = value === undefined || value === null || value === "" ? "—" : String(value);
    const height = Math.max(
      doc.heightOfString(displayValue, { width: valueWidth, font: "Helvetica", fontSize: 10 }),
      14
    );
    ensureSpace(doc, height + 6);
    const y = doc.y;
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.muted).text(label, PAGE_MARGIN, y, { width: labelWidth });
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.dark).text(displayValue, PAGE_MARGIN + labelWidth, y, { width: valueWidth });
    doc.y = y + height + 6;
    doc.x = PAGE_MARGIN;
  }
};

// columns: [{ header, key, width }] — width is a fraction of the usable page width (fractions should sum to ~1)
const table = (doc, { columns, rows }) => {
  const usableWidth = doc.page.width - PAGE_MARGIN * 2;
  const colWidths = columns.map((c) => c.width * usableWidth);
  const colX = [];
  let x = PAGE_MARGIN;
  for (const w of colWidths) {
    colX.push(x);
    x += w;
  }

  const drawHeaderRow = () => {
    const y = doc.y;
    doc.rect(PAGE_MARGIN, y, usableWidth, 20).fill(COLORS.brand);
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#ffffff");
    columns.forEach((col, i) => {
      doc.text(col.header, colX[i] + 5, y + 6, { width: colWidths[i] - 10, lineBreak: false });
    });
    doc.y = y + 20;
    doc.x = PAGE_MARGIN;
  };

  ensureSpace(doc, 20);
  drawHeaderRow();

  if (!rows.length) {
    ensureSpace(doc, 24);
    doc.font("Helvetica-Oblique").fontSize(9.5).fillColor(COLORS.muted).text("No records found.", PAGE_MARGIN + 5, doc.y + 6);
    doc.moveDown(1.4);
    doc.x = PAGE_MARGIN;
    return;
  }

  doc.font("Helvetica").fontSize(9).fillColor(COLORS.dark);

  rows.forEach((row, rowIndex) => {
    const cellHeights = row.map((cell, i) =>
      doc.heightOfString(String(cell ?? "—"), { width: colWidths[i] - 10, font: "Helvetica", fontSize: 9 })
    );
    const rowHeight = Math.max(...cellHeights, 16) + 8;

    if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      drawHeaderRow();
      doc.font("Helvetica").fontSize(9).fillColor(COLORS.dark);
    }

    const y = doc.y;
    if (rowIndex % 2 === 1) {
      doc.rect(PAGE_MARGIN, y, usableWidth, rowHeight).fill(COLORS.zebraBg);
      doc.fillColor(COLORS.dark);
    }

    row.forEach((cell, i) => {
      doc.text(String(cell ?? "—"), colX[i] + 5, y + 4, { width: colWidths[i] - 10 });
    });

    doc
      .moveTo(PAGE_MARGIN, y + rowHeight)
      .lineTo(PAGE_MARGIN + usableWidth, y + rowHeight)
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .stroke();

    doc.y = y + rowHeight;
    doc.x = PAGE_MARGIN;
  });

  doc.moveDown(0.6);
};

// Embeds a raster profile picture directly from disk. Silently skipped if
// the URL doesn't resolve to a readable image file (e.g. missing, or a PDF
// document rather than a photo) — a missing photo must never fail the export.
const embedProfilePicture = (doc, profilePictureUrl) => {
  const filepath = resolveStoredFilePath(profilePictureUrl);
  if (!filepath || !fsSync.existsSync(filepath)) return false;
  try {
    ensureSpace(doc, 110);
    doc.image(filepath, PAGE_MARGIN, doc.y, { width: 90, height: 90, fit: [90, 90] });
    doc.y += 100;
    doc.x = PAGE_MARGIN;
    return true;
  } catch {
    return false;
  }
};

/**
 * Streams a professionally formatted PDF report to `res`.
 *
 * sections: Array<
 *   | { heading: string, type: "keyvalue", rows: [label, value][] }
 *   | { heading: string, type: "table", columns: {header,key,width}[], rows: any[][] }
 *   | { heading: string, type: "profilePicture", url: string }
 * >
 */
export const generatePersonalDataPdf = (res, { filename, reportTitle, generatedFor, sections }) => {
  const doc = new PDFDocument({ margin: PAGE_MARGIN, bufferPages: true, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  doc.pipe(res);

  drawDocumentHeader(doc, { reportTitle, generatedFor });

  for (const section of sections) {
    sectionHeading(doc, section.heading);
    if (section.type === "keyvalue") {
      keyValueBlock(doc, section.rows);
    } else if (section.type === "table") {
      table(doc, section);
    } else if (section.type === "profilePicture") {
      const embedded = embedProfilePicture(doc, section.url);
      if (!embedded) {
        doc.font("Helvetica-Oblique").fontSize(9.5).fillColor(COLORS.muted).text("No profile picture on file.");
        doc.moveDown(0.6);
      }
    }
  }

  const pageRange = doc.bufferedPageRange();
  for (let i = 0; i < pageRange.count; i++) {
    doc.switchToPage(i);
    drawFooter(doc, i + 1, pageRange.count);
  }

  doc.end();
};
