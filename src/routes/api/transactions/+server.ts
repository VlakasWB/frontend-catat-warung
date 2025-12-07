import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/db';
import type { ParsedRow } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
  const limit = Number(url.searchParams.get('limit') ?? 20);
  const data = await prisma.transaction.findMany({
    orderBy: { created_at: 'desc' },
    take: Math.min(limit, 100)
  });
  return json(data);
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const rows = (body?.rows ?? []) as ParsedRow[];

  if (!Array.isArray(rows) || rows.length === 0) {
    throw error(400, 'Rows kosong.');
  }

  const toInsert = rows.map((row) => ({
    date: row.date ? new Date(row.date) : new Date(),
    item: row.item || 'Item',
    qty: row.qty ?? 1,
    unit: row.unit || 'pcs',
    price: row.price ? Math.round(row.price) : null,
    total: row.total ? Math.round(row.total) : null,
    type: row.type || 'penjualan',
    phone: row.phone || null,
    address: row.address || null
  }));

  await prisma.transaction.createMany({ data: toInsert });

  return json({ ok: true, inserted: toInsert.length });
};
