import jsPDF from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";

export function exportTableToPDF<T = Record<string, unknown>>({
  data,
  columns,
  fileName = "export.pdf",
  title = "",
}: {
  data: T[];
  columns: { title: string; field: keyof T | string }[];
  fileName?: string;
  title?: string;
}) {
  const doc = new jsPDF();
  if (title) {
    doc.text(title, 14, 16);
  }
  // Prepare rows for autoTable (type-safe: string[][])
  const rows: string[][] = data.map((row) =>
    columns.map((col) => String(row[col.field as keyof T] ?? ""))
  );
  autoTable(doc, {
    head: [columns.map((col) => col.title)],
    body: rows,
    startY: title ? 22 : 10,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [22, 160, 133] },
  } as UserOptions);
  doc.save(fileName);
}
