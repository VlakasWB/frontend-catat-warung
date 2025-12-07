import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { OutputFile } from '$lib/types';

export const load: PageLoad = async ({ fetch }) => {
  const response = await fetch('/api/scan/outputs');

  if (!response.ok) {
    const detail = await response.text();
    throw error(response.status, detail || 'Gagal mengambil daftar output');
  }

  const data = (await response.json()) as { count: number; files: OutputFile[] };
  return { outputs: data };
};
