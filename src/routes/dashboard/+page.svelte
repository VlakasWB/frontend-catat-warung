<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
      value || 0
    );
</script>

<div class="space-y-6">
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div class="card">
      <p class="text-sm text-slate-400">Omzet hari ini</p>
      <p class="text-2xl font-semibold text-sky-300 mt-2">{formatCurrency(data.summary.today)}</p>
    </div>
    <div class="card">
      <p class="text-sm text-slate-400">Omzet bulan ini</p>
      <p class="text-2xl font-semibold text-sky-300 mt-2">{formatCurrency(data.summary.month)}</p>
    </div>
    <div class="card">
      <p class="text-sm text-slate-400">Jumlah transaksi</p>
      <p class="text-2xl font-semibold text-sky-300 mt-2">{data.summary.count}</p>
    </div>
  </div>

  <div class="card">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-lg font-semibold text-slate-100">Transaksi terbaru</h2>
      <div class="flex gap-2 text-sm">
        <a class="underline text-sky-300" href="/api/export/csv">CSV</a>
        <a class="underline text-sky-300" href="/api/export/xlsx">XLSX</a>
        <a class="underline text-sky-300" href="/api/export/pdf">PDF</a>
        <a class="underline text-sky-300" href="/api/export/txt">TXT</a>
      </div>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full text-sm text-slate-200">
        <thead class="text-left text-slate-400 border-b border-slate-700">
          <tr>
            <th class="py-2 pr-4">Tanggal</th>
            <th class="py-2 pr-4">Item</th>
            <th class="py-2 pr-4">Qty</th>
            <th class="py-2 pr-4">Harga</th>
            <th class="py-2 pr-4">Total</th>
            <th class="py-2 pr-4">Tipe</th>
          </tr>
        </thead>
        <tbody>
          {#if data.latest.length === 0}
            <tr>
              <td colspan="6" class="py-3 text-slate-400">Belum ada data.</td>
            </tr>
          {:else}
            {#each data.latest as row}
              <tr class="border-b border-slate-800/60">
                <td class="py-2 pr-4">{row.date.slice(0, 10)}</td>
                <td class="py-2 pr-4">{row.item}</td>
                <td class="py-2 pr-4">{row.qty} {row.unit}</td>
                <td class="py-2 pr-4">{row.price ?? '-'}</td>
                <td class="py-2 pr-4">{row.total ?? '-'}</td>
                <td class="py-2 pr-4">{row.type}</td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>
