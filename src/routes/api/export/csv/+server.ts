import type { RequestHandler } from './$types';
import { asCsv } from '$lib/server/exporters';

export const GET: RequestHandler = async () => {
  const body = await asCsv();
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="transactions.csv"'
    }
  });
};
