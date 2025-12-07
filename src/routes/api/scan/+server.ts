import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OCR_SERVICE_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ request, fetch }) => {
  if (!OCR_SERVICE_URL) {
    throw error(500, 'OCR_SERVICE_URL belum di-set.');
  }

  const formData = await request.formData();
  const image = formData.get('image');

  if (!(image instanceof File)) {
    throw error(400, 'Field image wajib ada dan bertipe file.');
  }

  const backendUrl = `${OCR_SERVICE_URL.replace(/\/$/, '')}/scan`;
  let response: Response;
  try {
    response = await fetch(backendUrl, {
      method: 'POST',
      body: formData
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal menghubungi backend';
    throw error(502, message);
  }

  if (!response.ok) {
    const detail = await response.text();
    throw error(response.status, detail || 'Gagal memproses gambar');
  }

  const data = await response.json();
  return json(data);
};
