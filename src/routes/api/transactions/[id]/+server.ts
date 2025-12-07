import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/db';

export const PATCH: RequestHandler = async ({ params, request }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) throw error(400, 'ID tidak valid');

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.date) data.date = new Date(body.date);
  if (body.item !== undefined) data.item = String(body.item);
  if (body.qty !== undefined) data.qty = Number(body.qty);
  if (body.unit !== undefined) data.unit = body.unit ? String(body.unit) : null;
  if (body.price !== undefined) data.price = body.price === null ? null : Number(body.price);
  if (body.total !== undefined) data.total = body.total === null ? null : Number(body.total);
  if (body.type !== undefined) data.type = body.type ? String(body.type) : null;

  try {
    const updated = await prisma.transaction.update({
      where: { id },
      data
    });
    return json(updated);
  } catch (err) {
    throw error(500, 'Gagal memperbarui transaksi');
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) throw error(400, 'ID tidak valid');

  try {
    await prisma.transaction.delete({ where: { id } });
    return json({ ok: true });
  } catch (err) {
    throw error(500, 'Gagal menghapus transaksi');
  }
};
