import { prisma } from '$lib/server/db';
import XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

export const fetchTransactions = async () => {
  return prisma.transaction.findMany({ orderBy: { date: 'desc' } });
};

export const asTxt = async () => {
  const data = await fetchTransactions();
  const lines = data.map(
    (t) =>
      `${t.date.toISOString().slice(0, 10)} | ${t.item} | qty ${t.qty} ${t.unit ?? ''} | price ${t.price ?? ''} | total ${t.total ?? ''} | ${t.type ?? ''}`
  );
  return lines.join('\n');
};

export const asCsv = async () => {
  const data = await fetchTransactions();
  const header = 'date,item,qty,unit,price,total,type\n';
  const rows = data
    .map(
      (t) =>
        `${t.date.toISOString().slice(0, 10)},"${t.item.replace(/"/g, '""')}",${t.qty},${t.unit ?? ''},${t.price ?? ''},${t.total ?? ''},${t.type ?? ''}`
    )
    .join('\n');
  return header + rows;
};

export const asXlsx = async () => {
  const data = await fetchTransactions();
  const worksheetData = [
    ['date', 'item', 'qty', 'unit', 'price', 'total', 'type'],
    ...data.map((t) => [
      t.date.toISOString().slice(0, 10),
      t.item,
      t.qty,
      t.unit ?? '',
      t.price ?? '',
      t.total ?? '',
      t.type ?? ''
    ])
  ];
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'transactions');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
};

export const asPdf = async () => {
  const data = await fetchTransactions();
  const doc = new PDFDocument({ margin: 40 });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk as Buffer));

  doc.fontSize(16).text('Catat Warung - Transaksi', { underline: true });
  doc.moveDown();

  data.slice(0, 200).forEach((t) => {
    doc
      .fontSize(11)
      .text(
        `${t.date.toISOString().slice(0, 10)} | ${t.item} | qty ${t.qty} ${t.unit ?? ''} | total ${t.total ?? t.price ?? ''} | ${t.type ?? ''}`,
        { paragraphGap: 6 }
      );
  });

  doc.end();

  return await new Promise<Buffer>((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
};
