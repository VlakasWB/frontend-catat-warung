import type { RequestHandler } from './$types';
import { asXlsx } from '$lib/server/exporters';

export const GET: RequestHandler = async () => {
  const body = await asXlsx();
  return new Response(body, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="transactions.xlsx"'
    }
  });
};
