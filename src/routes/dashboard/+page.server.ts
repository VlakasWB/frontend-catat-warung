import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/db';

const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);

export const load: PageServerLoad = async () => {
  try {
    const [todaySum, monthSum, count, latest] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { total: true },
        where: { date: { gte: startOfDay() } }
      }),
      prisma.transaction.aggregate({
        _sum: { total: true },
        where: { date: { gte: startOfMonth() } }
      }),
      prisma.transaction.count(),
      prisma.transaction.findMany({ orderBy: { date: 'desc' }, take: 10 })
    ]);

    return {
      summary: {
        today: todaySum._sum.total ?? 0,
        month: monthSum._sum.total ?? 0,
        count
      },
      latest: latest.map((t) => ({
        ...t,
        date: t.date.toISOString()
      })),
      error: null
    };
  } catch (err) {
    console.error('Failed to load dashboard data', err);
    const rawMsg = err instanceof Error ? err.message : String(err);
    const needsMigration = /Transaction\.phone|Transaction\.address|no such column/i.test(rawMsg);
    const friendly = needsMigration
      ? 'Skema database belum sesuai. Jalankan prisma migrate/dev push atau tambahkan kolom phone/address sesuai schema.'
      : rawMsg || 'Gagal memuat dashboard';
    return {
      summary: { today: 0, month: 0, count: 0 },
      latest: [],
      error: friendly
    };
  }
};
