import { createHash } from "crypto";
import { Booking } from "../types";
import { EXTRA_PRICES, Extra } from "./pricing";

// Invoices for a booking, as CSV or as a (tiny, hand-written) PDF.

const EXTRA_NAMES: Record<Extra, string> = {
  BREAKFAST: "Breakfast",
  PARKING: "Parking",
  LATE_CHECKOUT: "Late check-out",
};

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const money = (amount: number) => (Number.isInteger(amount) ? String(amount) : amount.toFixed(2));

export const invoiceNumber = (booking: Booking) =>
  `INV-${createHash("sha1").update(booking.id).digest("hex").slice(0, 8).toUpperCase()}`;

export const invoiceFileName = (booking: Booking, format: "pdf" | "csv") =>
  `invoice-room-${booking.room?.number ?? "unknown"}-${isoDate(booking.checkIn)}.${format}`;

export function invoiceLines(booking: Booking): InvoiceLine[] {
  const price = booking.room?.price ?? 0;
  const guests = booking.adults + booking.children;
  const lines: InvoiceLine[] = [
    {
      description: `Room ${booking.room?.number ?? ""} (${isoDate(booking.checkIn)} to ${isoDate(booking.checkOut)})`,
      quantity: booking.nights,
      unitPrice: price,
      amount: booking.nights * price,
    },
  ];
  for (const extra of booking.extras) {
    const { amount, per } = EXTRA_PRICES[extra];
    const quantity = per === "guest-night" ? guests * booking.nights : per === "night" ? booking.nights : 1;
    lines.push({ description: EXTRA_NAMES[extra], quantity, unitPrice: amount, amount: amount * quantity });
  }
  return lines;
}

const csvCell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function invoiceCsv(booking: Booking): string {
  const rows: (string | number)[][] = [
    ["description", "quantity", "unit_price", "amount"],
    ...invoiceLines(booking).map((line) => [line.description, line.quantity, money(line.unitPrice), money(line.amount)]),
    ["Total", "", "", money(booking.totalPrice)],
  ];
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

// PDF strings use WinAnsiEncoding: escape \ ( ) and write non-ASCII characters as octal codes.
const pdfText = (text: string) =>
  [...text]
    .map((char) => {
      if (char === "€") return "\\200";
      if (char === "\\" || char === "(" || char === ")") return `\\${char}`;
      const code = char.charCodeAt(0);
      if (code < 128) return char;
      return code < 256 ? `\\${code.toString(8).padStart(3, "0")}` : "?";
    })
    .join("");

interface PdfLine {
  text: string;
  size?: number;
  bold?: boolean;
  x?: number;
}

function simplePdf(lines: PdfLine[]): Buffer {
  let y = 790;
  const commands = lines
    .map((line) => {
      const size = line.size ?? 11;
      y -= size + 8;
      if (!line.text) return "";
      return `BT /${line.bold ? "F2" : "F1"} ${size} Tf ${line.x ?? 56} ${y} Td (${pdfText(line.text)}) Tj ET`;
    })
    .filter(Boolean)
    .join("\n");
  const content = Buffer.from(commands, "latin1");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${content.length} >>\nstream\n${content.toString("latin1")}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

export function invoicePdf(booking: Booking, hotelName: string): Buffer {
  const euro = (amount: number) => `€ ${money(amount)}`;
  return simplePdf([
    { text: hotelName, size: 20, bold: true },
    { text: `Invoice ${invoiceNumber(booking)}`, size: 14, bold: true },
    { text: "" },
    { text: `Guest: ${booking.user?.username ?? ""} (${booking.user?.email ?? ""})` },
    { text: `Room: ${booking.room?.number ?? ""}` },
    { text: `Check-in: ${isoDate(booking.checkIn)}` },
    { text: `Check-out: ${isoDate(booking.checkOut)}` },
    { text: `Guests: ${booking.adults} adult(s), ${booking.children} child(ren)` },
    { text: `Status: ${booking.status}` },
    { text: "" },
    ...invoiceLines(booking).map((line) => ({
      text: `${line.description}: ${line.quantity} x ${euro(line.unitPrice)} = ${euro(line.amount)}`,
    })),
    { text: "" },
    { text: `Total: ${euro(booking.totalPrice)}`, size: 14, bold: true },
  ]);
}
