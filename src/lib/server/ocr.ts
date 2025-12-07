import { OCR_SERVICE_URL } from '$env/static/private';

type OcrResponse = { lines: string[]; boxes: number[][]; scores: number[] };

export const requestOcr = async (buffer: Buffer, mime: string): Promise<OcrResponse> => {
  if (!OCR_SERVICE_URL) {
    throw new Error('OCR_SERVICE_URL belum di-set.');
  }

  const formData = new FormData();
  const blob = new Blob([buffer], { type: mime || 'image/jpeg' });
  formData.set('image', blob, 'upload.jpg');

  const response = await fetch(`${OCR_SERVICE_URL.replace(/\/$/, '')}/ocr`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OCR service error: ${response.status} ${detail}`);
  }

  const data = (await response.json()) as OcrResponse;
  return data;
};
