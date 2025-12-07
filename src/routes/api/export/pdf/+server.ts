import type { RequestHandler } from './$types';
import { asPdf } from '$lib/server/exporters';

export const GET: RequestHandler = async () => {
  const body = await asPdf();
  return new Response(body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="transactions.pdf"'
    }
  });
};
