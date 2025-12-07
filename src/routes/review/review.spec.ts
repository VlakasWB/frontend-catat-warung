import { cleanup, fireEvent, render, screen } from '@testing-library/svelte/svelte5';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScanResult } from '$lib/types';
import ReviewPage from './+page.svelte';

const sampleRows = [
  { date: '2024-10-01', item: 'Item A', qty: 1, unit: 'pcs', price: 1000, total: 1000 },
  { date: '2024-10-02', item: 'Item B', qty: 2, unit: 'pcs', price: 2000, total: 4000 }
];

describe('Review page', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('loads parsed rows from sessionStorage and shows Groq badge', async () => {
    render(ReviewPage, {
      props: {
        initialScan: { lines: [], parsed: sampleRows, used_llm: true } as ScanResult
      }
    });
    await tick();

    expect(screen.getByDisplayValue('Item A')).toBeTruthy();
    expect(screen.getByDisplayValue('Item B')).toBeTruthy();
    expect(screen.getByText('Groq LLM aktif')).toBeTruthy();
  });

  it('defaults type to penjualan when marked valid', async () => {
    render(ReviewPage, {
      props: {
        initialScan: { lines: [], parsed: [{ ...sampleRows[0], type: undefined }], used_llm: false } as ScanResult
      }
    });
    await tick();

    await fireEvent.click(screen.getByText(/Benar/));
    await tick();

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('penjualan');
  });

  it('removes a row when delete is clicked', async () => {
    render(ReviewPage, {
      props: {
        initialScan: { lines: [], parsed: sampleRows, used_llm: false } as ScanResult
      }
    });
    await tick();

    await fireEvent.click(screen.getAllByText(/Hapus/)[0]);
    await tick();

    expect(screen.queryByDisplayValue('Item A')).toBeNull();
    expect(screen.getByDisplayValue('Item B')).toBeTruthy();
  });
});
