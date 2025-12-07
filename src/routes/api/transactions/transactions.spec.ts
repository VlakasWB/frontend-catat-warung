import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from './+server';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    transaction: {
      findMany: vi.fn(),
      createMany: vi.fn()
    }
  }
}));

vi.mock('$lib/server/db', () => ({ prisma: prismaMock }));

const { findMany, createMany } = prismaMock.transaction;

describe('/api/transactions', () => {
  beforeEach(() => {
    findMany.mockReset();
    createMany.mockReset();
  });

  it('returns recent transactions with limit applied', async () => {
    const fakeRows = [{ id: 1, item: 'Test' }];
    findMany.mockResolvedValue(fakeRows);

    const res = await GET({ url: new URL('https://example.com/api/transactions?limit=5') } as any);

    expect(findMany).toHaveBeenCalledWith({
      orderBy: { created_at: 'desc' },
      take: 5
    });
    expect(await res.json()).toEqual(fakeRows);
  });

  it('inserts mapped rows and defaults type when missing', async () => {
    createMany.mockResolvedValue({ count: 1 });
    const payload = {
      rows: [{ date: '2024-05-01', item: 'Item A', qty: 2, price: 1000, total: 2000 }]
    };

    const res = await POST({
      request: new Request('https://example.com/api/transactions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } as any);

    expect(createMany).toHaveBeenCalledTimes(1);
    const args = createMany.mock.calls[0][0];
    expect(args.data[0].item).toBe('Item A');
    expect(args.data[0].type).toBe('penjualan');
    expect(args.data[0].date instanceof Date).toBe(true);
    expect(await res.json()).toEqual({ ok: true, inserted: 1 });
  });

  it('rejects empty rows payload', async () => {
    const request = new Request('https://example.com/api/transactions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rows: [] })
    });

    await expect(POST({ request } as any)).rejects.toMatchObject({ status: 400 });
    expect(createMany).not.toHaveBeenCalled();
  });
});
