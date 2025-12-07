import { cleanup, fireEvent, render, screen } from '@testing-library/svelte/svelte5';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OutputsPage from './+page.svelte';
import type { OutputFile } from '$lib/types';

const sampleFiles: OutputFile[] = [
  { name: 'annotated_1.jpg', url: 'http://localhost/output/annotated_1.jpg', size_bytes: 2048, modified_at: '2024-01-01T00:00:00Z' },
  { name: 'ocr.txt', url: 'http://localhost/output/ocr.txt', size_bytes: 512, modified_at: '2024-01-02T00:00:00Z' }
];

describe('Outputs page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders list of output files', async () => {
    render(OutputsPage, { props: { data: { outputs: { count: sampleFiles.length, files: sampleFiles } } as any } });

    expect(screen.getByText('annotated_1.jpg')).toBeTruthy();
    expect(screen.getByText('ocr.txt')).toBeTruthy();
    expect(screen.getAllByText('Buka').length).toBe(2);
  });

  it('refreshes list from API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ files: [sampleFiles[0]] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    render(OutputsPage, { props: { data: { outputs: { count: 0, files: [] } } as any } });

    const refreshButton = screen.getByRole('button', { name: /Refresh/ });
    await fireEvent.click(refreshButton);

    expect(fetchSpy).toHaveBeenCalledWith('/api/scan/outputs');
    expect(await screen.findByText('annotated_1.jpg')).toBeTruthy();
  });
});
