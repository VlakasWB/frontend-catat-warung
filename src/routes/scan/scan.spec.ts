import { cleanup, fireEvent, render, screen } from '@testing-library/svelte/svelte5';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ScanPage from './+page.svelte';

describe('Scan page', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('clears previous scan results on mount', async () => {
    sessionStorage.setItem('scanResult', 'stale');
    render(ScanPage);
    await tick();
    await tick();
    await Promise.resolve();
    expect(sessionStorage.getItem('scanResult')).toBeNull();
  });

  it('shows a validation error when no file is provided', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(ScanPage);
    const form = screen.getByTestId('scan-form');
    const [submitButton] = screen.getAllByRole('button', { name: 'Proses nota' });

    await fireEvent.click(submitButton);
    await fireEvent.submit(form);
    await tick();
    await tick();

    expect(await screen.findByText(/Pilih file gambar terlebih dahulu/)).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
