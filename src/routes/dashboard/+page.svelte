<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;

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
  let rows = (data.latest ?? []).map((t) => ({
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

  const inputClass =
    'h-12 w-full rounded-2xl border border-border bg-white px-4 text-[16px] text-fg placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/40 focus:outline-none';
</script>

<div class="space-y-8">
  {#if data.error}
    <div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
      <p class="text-sm font-semibold">Gagal memuat dashboard</p>
      <p class="text-sm">{data.error}</p>
    </div>
  {/if}

  <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <div class="card">
      <p class="text-sm text-muted">Omzet hari ini</p>
      <p class="mt-2 text-2xl font-semibold text-brand">{formatCurrency(data.summary.today)}</p>
    </div>
    <div class="card">
      <p class="text-sm text-muted">Omzet bulan ini</p>
      <p class="mt-2 text-2xl font-semibold text-brand">{formatCurrency(data.summary.month)}</p>
    </div>
    <div class="card">
      <p class="text-sm text-muted">Jumlah transaksi</p>
      <p class="mt-2 text-2xl font-semibold text-brand">{data.summary.count}</p>
    </div>
  </div>

  <div class="card space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-xl font-semibold text-fg">Transaksi terbaru</h2>
      <div class="flex flex-wrap gap-2 text-sm">
        <a class="inline-flex h-11 items-center rounded-2xl border border-border bg-white px-3 text-fg hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none" href="/api/export/csv">CSV</a>
        <a class="inline-flex h-11 items-center rounded-2xl border border-border bg-white px-3 text-fg hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none" href="/api/export/xlsx">XLSX</a>
        <a class="inline-flex h-11 items-center rounded-2xl border border-border bg-white px-3 text-fg hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none" href="/api/export/pdf">PDF</a>
        <a class="inline-flex h-11 items-center rounded-2xl border border-border bg-white px-3 text-fg hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none" href="/api/export/txt">TXT</a>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full text-sm text-fg">
        <thead class="bg-slate-50 text-left text-muted">
          <tr>
            <th class="px-3 py-2 font-semibold">Tanggal</th>
            <th class="px-3 py-2 font-semibold">Item</th>
            <th class="px-3 py-2 font-semibold">Qty</th>
            <th class="px-3 py-2 font-semibold">Harga</th>
            <th class="px-3 py-2 font-semibold">Total</th>
            <th class="px-3 py-2 font-semibold">Tipe</th>
            <th class="px-3 py-2 font-semibold text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {#if rows.length === 0}
            <tr>
              <td colspan="7" class="px-3 py-6 text-center text-muted">Belum ada data.</td>
            </tr>
          {:else}
            {#each rows as row}
              <tr class="border-b border-border/70">
                <td class="px-3 py-3 align-top">
                  {#if editingId === row.id}
                    <input
                      class={inputClass}
                      type="date"
                      value={editingRow?.date ?? row.date}
                      on:input={(e) => applyChange('date', (e.target as HTMLInputElement).value)}
                    />
                  {:else}
                    <p class="text-base font-semibold text-fg">{row.date}</p>
                  {/if}
                </td>
                <td class="px-3 py-3 align-top">
                  {#if editingId === row.id}
                    <input
                      class={inputClass}
                      value={editingRow?.item ?? row.item}
                      on:input={(e) => applyChange('item', (e.target as HTMLInputElement).value)}
                    />
                  {:else}
                    <p class="text-base text-fg">{row.item}</p>
                  {/if}
                </td>
                <td class="px-3 py-3 align-top">
                  {#if editingId === row.id}
                    <div class="flex gap-2">
                      <input
                        class={`${inputClass} w-24`}
                        type="number"
                        value={editingRow?.qty ?? row.qty}
                        on:input={(e) => applyChange('qty', (e.target as HTMLInputElement).value)}
                      />
                      <input
                        class={`${inputClass} w-24`}
                        value={editingRow?.unit ?? row.unit ?? ''}
                        on:input={(e) => applyChange('unit', (e.target as HTMLInputElement).value)}
                      />
                    </div>
                  {:else}
                    <p class="text-base text-fg">{row.qty} {row.unit}</p>
                  {/if}
                </td>
                <td class="px-3 py-3 align-top">
                  {#if editingId === row.id}
                    <input
                      class={inputClass}
                      type="number"
                      value={editingRow?.price ?? row.price ?? ''}
                      on:input={(e) => applyChange('price', (e.target as HTMLInputElement).value)}
                    />
                  {:else}
                    <p class="text-base text-fg">{row.price ?? '-'}</p>
                  {/if}
                </td>
                <td class="px-3 py-3 align-top">
                  {#if editingId === row.id}
                    <input
                      class={inputClass}
                      type="number"
                      value={editingRow?.total ?? row.total ?? ''}
                      on:input={(e) => applyChange('total', (e.target as HTMLInputElement).value)}
                    />
                  {:else}
                    <p class="text-base text-fg">{row.total ?? '-'}</p>
                  {/if}
                </td>
                <td class="px-3 py-3 align-top">
                  {#if editingId === row.id}
                    <select
                      class={inputClass}
                      value={editingRow?.type ?? row.type ?? ''}
                      on:change={(e) => applyChange('type', (e.target as HTMLSelectElement).value)}
                    >
                      <option value="penjualan">Penjualan</option>
                      <option value="pengeluaran">Pengeluaran</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  {:else}
                    <p class="text-base capitalize text-fg">{row.type}</p>
                  {/if}
                </td>
                <td class="px-3 py-3 text-right align-top">
                  {#if editingId === row.id}
                    <div class="flex flex-wrap justify-end gap-2">
                      <button
                        class="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-white px-4 text-sm font-semibold text-fg hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                        disabled={saving}
                        on:click={cancelEdit}
                        type="button"
                      >
                        Batal
                      </button>
                      <button
                        class="brand-gradient inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-white shadow-soft transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none disabled:opacity-60"
                        disabled={saving}
                        on:click={saveRow}
                        type="button"
                      >
                        {saving ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </div>
                  {:else}
                    <div class="flex flex-wrap justify-end gap-2">
                      <button
                        class="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-white px-4 text-sm font-semibold text-fg hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                        type="button"
                        on:click={() => startEdit(row)}
                      >
                        Edit
                      </button>
                      <button
                        class="inline-flex h-11 items-center justify-center rounded-2xl border border-error/50 bg-rose-50 px-4 text-sm font-semibold text-error hover:bg-rose-100 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                        disabled={saving}
                        type="button"
                        on:click={() => deleteRow(row.id)}
                      >
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
        <p class="mt-2 text-sm font-semibold text-error">{err}</p>
      {/if}
    </div>
  </div>
</div>
