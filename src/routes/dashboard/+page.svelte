<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;

  import { onMount } from 'svelte';

  type EditRow = {
    id: number;
    date: string;
    item: string;
    qty: number;
    unit?: string | null;
    price?: number | null;
    total?: number | null;
    type?: string | null;
  };

  let editingId: number | null = null;
  let editingRow: EditRow | null = null;
  let rows = data.latest.map((t) => ({
    ...t,
    date: t.date.slice(0, 10)
  }));
  let saving = false;
  let err: string | null = null;

  const startEdit = (row: EditRow) => {
    editingId = row.id;
    editingRow = { ...row };
    err = null;
  };

  const cancelEdit = () => {
    editingId = null;
    editingRow = null;
    err = null;
    rows = data.latest.map((t) => ({
      ...t,
      date: t.date.slice(0, 10)
    }));
  };

  const applyChange = (field: keyof EditRow, value: string) => {
    if (!editingRow) return;
    const next = { ...editingRow };
    if (field === 'qty' || field === 'price' || field === 'total') {
      next[field] = value === '' ? null : Number(value);
    } else {
      (next as any)[field] = value;
    }
    editingRow = next;
  };

  const saveRow = async () => {
    if (!editingRow) return;
    saving = true;
    err = null;
    try {
      const res = await fetch(`/api/transactions/${editingRow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRow)
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Gagal menyimpan');
      }
      const updated = await res.json();
      rows = rows.map((r) => (r.id === updated.id ? { ...updated, date: updated.date.slice(0, 10) } : r));
      editingId = null;
      editingRow = null;
    } catch (e) {
      err = e instanceof Error ? e.message : 'Gagal menyimpan';
    } finally {
      saving = false;
    }
  };

  const deleteRow = async (id: number) => {
    saving = true;
    err = null;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Gagal menghapus');
      }
      rows = rows.filter((r) => r.id !== id);
      if (editingId === id) {
        editingId = null;
        editingRow = null;
      }
    } catch (e) {
      err = e instanceof Error ? e.message : 'Gagal menghapus';
    } finally {
      saving = false;
    }
  };

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
          {#if rows.length === 0}
            <tr>
              <td colspan="6" class="py-3 text-slate-400">Belum ada data.</td>
            </tr>
          {:else}
            {#each rows as row}
              <tr class="border-b border-slate-800/60">
                <td class="py-2 pr-4">
                  {#if editingId === row.id}
                    <input
                      class="input"
                      type="date"
                      value={editingRow?.date ?? row.date}
                      on:input={(e) => applyChange('date', (e.target as HTMLInputElement).value)}
                    />
                  {:else}
                    {row.date}
                  {/if}
                </td>
                <td class="py-2 pr-4">
                  {#if editingId === row.id}
                    <input
                      class="input"
                      value={editingRow?.item ?? row.item}
                      on:input={(e) => applyChange('item', (e.target as HTMLInputElement).value)}
                    />
                  {:else}
                    {row.item}
                  {/if}
                </td>
                <td class="py-2 pr-4">
                  {#if editingId === row.id}
                    <div class="flex gap-2">
                      <input
                        class="input w-20"
                        type="number"
                        value={editingRow?.qty ?? row.qty}
                        on:input={(e) => applyChange('qty', (e.target as HTMLInputElement).value)}
                      />
                      <input
                        class="input w-20"
                        value={editingRow?.unit ?? row.unit ?? ''}
                        on:input={(e) => applyChange('unit', (e.target as HTMLInputElement).value)}
                      />
                    </div>
                  {:else}
                    {row.qty} {row.unit}
                  {/if}
                </td>
                <td class="py-2 pr-4">
                  {#if editingId === row.id}
                    <input
                      class="input"
                      type="number"
                      value={editingRow?.price ?? row.price ?? ''}
                      on:input={(e) => applyChange('price', (e.target as HTMLInputElement).value)}
                    />
                  {:else}
                    {row.price ?? '-'}
                  {/if}
                </td>
                <td class="py-2 pr-4">
                  {#if editingId === row.id}
                    <input
                      class="input"
                      type="number"
                      value={editingRow?.total ?? row.total ?? ''}
                      on:input={(e) => applyChange('total', (e.target as HTMLInputElement).value)}
                    />
                  {:else}
                    {row.total ?? '-'}
                  {/if}
                </td>
                <td class="py-2 pr-4">
                  {#if editingId === row.id}
                    <select
                      class="input"
                      value={editingRow?.type ?? row.type ?? ''}
                      on:change={(e) => applyChange('type', (e.target as HTMLSelectElement).value)}
                    >
                      <option value="penjualan">Penjualan</option>
                      <option value="pengeluaran">Pengeluaran</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  {:else}
                    {row.type}
                  {/if}
                </td>
                <td class="py-2 pr-4 text-right">
                  {#if editingId === row.id}
                    <div class="flex gap-2 justify-end">
                      <button class="btn ghost" disabled={saving} on:click={cancelEdit} type="button">Batal</button>
                      <button class="btn primary" disabled={saving} on:click={saveRow} type="button">
                        {saving ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </div>
                  {:else}
                    <div class="flex gap-2 justify-end">
                      <button class="btn ghost" type="button" on:click={() => startEdit(row)}>Edit</button>
                      <button class="btn danger" disabled={saving} type="button" on:click={() => deleteRow(row.id)}>
                        Hapus
                      </button>
                    </div>
                  {/if}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
      {#if err}
        <p class="text-rose-400 text-sm mt-2">{err}</p>
      {/if}
    </div>
  </div>
</div>

<style>
  :global(:root) {
    --surface: #0f172a;
    --surface-muted: #111827;
    --border: #1f2937;
    --text: #e2e8f0;
    --muted: #94a3b8;
  }
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 16px;
    box-shadow: 0 10px 35px rgba(0, 0, 0, 0.12);
  }
  .text-muted {
    color: var(--muted);
  }
  .btn {
    border-radius: 10px;
    padding: 8px 12px;
    border: 1px solid var(--border);
    background: var(--surface-muted);
    color: var(--text);
    font-weight: 600;
    font-size: 12px;
  }
  .btn.primary {
    background-image: linear-gradient(90deg, #22d3ee, #2563eb);
    color: #0b1021;
    border: none;
  }
  .btn.danger {
    border-color: #f87171;
    color: #fca5a5;
  }
  .input {
    background: var(--surface-muted);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 6px 8px;
    color: var(--text);
    width: 100%;
  }
  table .input {
    min-width: 120px;
  }
</style>
