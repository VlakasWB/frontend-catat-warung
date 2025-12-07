import type { ParsedRow } from '$lib/types';

const dateRegexes = [
  /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/,
  /\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b/
];

const parseDate = (line: string): string | null => {
  for (const re of dateRegexes) {
    const match = line.match(re);
    if (match) {
      const raw = match[1];
      const parts = raw.replace(/\s+/g, '').split(/[/-]/);
      if (parts[0].length === 4) {
        return raw;
      }
      // Assume dd/mm/yyyy
      const [d, m, y] = parts;
      const year = y.length === 2 ? `20${y}` : y;
      return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  return null;
};

const parseNumber = (input: string): number | null => {
  const cleaned = input.replace(/[^\d.,-]/g, '').replace(',', '.');
  if (!cleaned || !/\d/.test(cleaned)) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
};

const parseLineToRow = (line: string, detectedDate: string | null): ParsedRow | null => {
  const tokens = line.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  // Try to locate price (last number)
  let price: number | null = null;
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const num = parseNumber(tokens[i]);
    if (num !== null) {
      price = num;
      tokens.splice(i, 1);
      break;
    }
  }

  // Try qty (next number from the end)
  let qty: number | null = null;
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const num = parseNumber(tokens[i]);
    if (num !== null) {
      qty = num;
      tokens.splice(i, 1);
      break;
    }
  }

  if (price === null && qty === null) {
    return null;
  }

  const item = tokens.join(' ').trim();
  if (!item) return null;

  const total = qty !== null && price !== null ? Math.round(qty * price) : price ?? undefined;

  return {
    date: detectedDate ?? '',
    item,
    qty: qty ?? 1,
    unit: 'pcs',
    price: price ?? undefined,
    total,
    type: 'penjualan',
    source: 'rule'
  };
};

export const parseLinesRuleBased = (lines: string[]): ParsedRow[] => {
  let detectedDate: string | null = null;
  for (const line of lines) {
    const d = parseDate(line);
    if (d) {
      detectedDate = d;
      break;
    }
  }

  const rows: ParsedRow[] = [];
  for (const line of lines) {
    const row = parseLineToRow(line, detectedDate);
    if (row) rows.push(row);
  }

  // If no row found but date exists, at least return date meta row
  if (rows.length === 0 && detectedDate) {
    rows.push({
      date: detectedDate,
      item: 'Tanggal',
      qty: 1,
      unit: '',
      price: undefined,
      total: undefined,
      type: 'meta',
      source: 'rule'
    });
  }

  return rows;
};
