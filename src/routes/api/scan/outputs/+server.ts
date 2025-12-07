import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OCR_SERVICE_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ fetch }) => {
  if (!OCR_SERVICE_URL) {
    throw error(500, 'OCR_SERVICE_URL belum di-set.');
  }

  const backendUrl = `${OCR_SERVICE_URL.replace(/\/$/, '')}/scan/outputs`;
  let response: Response;
  try {
    response = await fetch(backendUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal menghubungi backend';
    throw error(502, message);
  }

  if (!response.ok) {
    const detail = await response.text();
    throw error(response.status, detail || 'Gagal mengambil daftar output');
  }

  const data = await response.json();

  const withBase = (maybePath?: string | null) => {
    if (!maybePath) return maybePath;
    if (/^https?:\/\//i.test(maybePath)) return maybePath;
    const base = OCR_SERVICE_URL.replace(/\/$/, '');
    const normalized = maybePath.replace(/^\/+/, '');
    return `${base}/${normalized}`;
  };

  const files = Array.isArray(data.files)
    ? data.files.map((f: any) => ({
        ...f,
        url: withBase(f.url)
      }))
    : [];

  return json({
    count: data.count ?? files.length,
    files
  });
};
