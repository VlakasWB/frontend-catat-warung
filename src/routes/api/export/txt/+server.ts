import type { RequestHandler } from './$types';
import { asTxt } from '$lib/server/exporters';

export const GET: RequestHandler = async () => {
  const body = await asTxt();
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="transactions.txt"'
    }
  });
};
