import { describe, it, expect } from 'vitest';
import { parseLinesRuleBased } from './parsing';

describe('parseLinesRuleBased', () => {
  it('parses lines with date, qty, and price', () => {
    const lines = ['12/08/2024', 'Indomie Goreng 2 4500', 'Teh Botol 1 5000'];
    const rows = parseLinesRuleBased(lines);

    expect(rows.length).toBe(2);
    expect(rows[0].date).toContain('2024');
    expect(rows[0].item.toLowerCase()).toContain('indomie');
    expect(rows[0].qty).toBe(2);
    expect(rows[0].price).toBe(4500);
  });

  it('returns meta row when only date is found', () => {
    const lines = ['2024-05-01', 'Catatan tanpa angka'];
    const rows = parseLinesRuleBased(lines);

    expect(rows.length).toBe(1);
    expect(rows[0].type).toBe('meta');
  });

  it('ignores lines without numbers and without date', () => {
    const lines = ['Catatan tanpa angka sama sekali'];
    const rows = parseLinesRuleBased(lines);

    expect(rows.length).toBe(0);
  });
});
