<script lang="ts">
  import { onMount } from 'svelte';
  import type { ParsedRow, ScanResult } from '$lib/types';

  export let initialScan: ScanResult | null = null;

  let scan: ScanResult | null = null;
  let rows: ParsedRow[] = [];
  let status: string | null = null;
  let saving = false;

  if (initialScan) {
    scan = initialScan;
    rows = initialScan.parsed?.map((r) => ({ ...r })) ?? [];
  }

  onMount(() => {
    if (scan && rows.length > 0) return;

    const cached =
      initialScan ??
      (() => {
        const stored = sessionStorage.getItem('scanResult');
        return stored ? (JSON.parse(stored) as ScanResult) : null;
      })();

    if (!cached) return;

    scan = cached;
    rows = cached.parsed?.map((r) => ({ ...r })) ?? [];
  });

  const markValid = (idx: number) => {
    rows = rows.map((row, i) => (i === idx ? { ...row, type: row.type || 'penjualan' } : row));
  };

  const removeRow = (idx: number) => {
    rows = rows.filter((_, i) => i !== idx);
  };

  const updateField = (idx: number, field: keyof ParsedRow, value: string) => {
    rows = rows.map((row, i) =>
      i === idx
        ? {
            ...row,
            [field]: field === 'qty' || field === 'price' || field === 'total' ? Number(value) : value
          }
        : row
    );
  };

  const save = async () => {
    saving = true;
    status = null;
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows })
    });
    if (response.ok) {
    status = 'Tersimpan ke database.';
    sessionStorage.removeItem('scanResult');
    // Redirect to dashboard so user can immediately see the saved data
    goto('/dashboard');
  } else {
    status = 'Gagal simpan.';
  }
  saving = false;
};
</script>

<div class="space-y-6">
  <div class="card">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-100">Review & Validasi</h1>
        <p class="text-slate-400 text-sm">Tandai benar/salah, edit inline, lalu simpan.</p>
      </div>
      {#if scan?.used_llm}
        <span class="text-xs bg-emerald-500/20 text-emerald-200 px-3 py-1 rounded-full">Groq LLM aktif</span>
      {:else}
        <span class="text-xs bg-slate-700 px-3 py-1 rounded-full">Rule-based</span>
      {/if}
    </div>
  </div>

  <div class="card overflow-x-auto">
    <table class="min-w-full text-sm text-slate-200">
      <thead class="text-left text-slate-400 border-b border-slate-700">
        <tr>
          <th class="py-2 pr-3">Tanggal</th>
          <th class="py-2 pr-3">Item</th>
          <th class="py-2 pr-3">Qty</th>
          <th class="py-2 pr-3">Unit</th>
          <th class="py-2 pr-3">Harga</th>
          <th class="py-2 pr-3">Total</th>
          <th class="py-2 pr-3">Type</th>
          <th class="py-2 pr-3">Aksi</th>
        </tr>
      </thead>
      <tbody>
        {#if rows.length === 0}
          <tr>
            <td colspan="8" class="py-4 text-slate-400">Belum ada hasil. Mulai dari halaman scan.</td>
          </tr>
        {:else}
          {#each rows as row, idx}
            <tr class="border-b border-slate-800/60">
              <td class="py-2 pr-3">
                <input
                  class="input"
                  value={row.date}
                  on:input={(e) => updateField(idx, 'date', (e.target as HTMLInputElement).value)}
                />
              </td>
              <td class="py-2 pr-3">
                <input
                  class="input"
                  value={row.item}
                  on:input={(e) => updateField(idx, 'item', (e.target as HTMLInputElement).value)}
                />
              </td>
              <td class="py-2 pr-3 w-20">
                <input
                  class="input"
                  type="number"
                  value={row.qty}
                  on:input={(e) => updateField(idx, 'qty', (e.target as HTMLInputElement).value)}
                />
              </td>
              <td class="py-2 pr-3 w-24">
                <input
                  class="input"
                  value={row.unit ?? ''}
                  on:input={(e) => updateField(idx, 'unit', (e.target as HTMLInputElement).value)}
                />
              </td>
              <td class="py-2 pr-3 w-24">
                <input
                  class="input"
                  type="number"
                  value={row.price ?? ''}
                  on:input={(e) => updateField(idx, 'price', (e.target as HTMLInputElement).value)}
                />
              </td>
              <td class="py-2 pr-3 w-24">
                <input
                  class="input"
                  type="number"
                  value={row.total ?? ''}
                  on:input={(e) => updateField(idx, 'total', (e.target as HTMLInputElement).value)}
                />
              </td>
              <td class="py-2 pr-3 w-28">
                <select
                  class="input"
                  value={row.type ?? ''}
                  on:change={(e) => updateField(idx, 'type', (e.target as HTMLSelectElement).value)}
                >
                  <option value="penjualan">Penjualan</option>
                  <option value="pengeluaran">Pengeluaran</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </td>
              <td class="py-2 pr-3 flex gap-2">
                <button class="pill success" on:click={() => markValid(idx)}>Benar</button>
                <button class="pill danger" on:click={() => removeRow(idx)}>Hapus</button>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>

  <div class="flex gap-3">
    <button class="btn-primary" on:click={save} disabled={rows.length === 0 || saving}>
      {#if saving}
        Menyimpan...
      {:else}
        Simpan
      {/if}
    </button>
    {#if saving}
      <span class="text-sm text-slate-300">Menyimpan ke database, mohon tunggu...</span>
    {:else if status}
      <span class="text-sm text-slate-300">{status}</span>
    {/if}
  </div>
</div>

<style>
  .input {
    @apply w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-sm;
  }
  .pill {
    @apply text-xs px-3 py-1 rounded-full border border-slate-700 hover:border-sky-400 transition;
  }
  .pill.success {
    @apply border-emerald-500 text-emerald-200;
  }
  .pill.danger {
    @apply border-rose-500 text-rose-300;
  }
  .btn-primary {
    @apply bg-sky-500 hover:bg-sky-400 text-slate-900 font-semibold px-4 py-2 rounded-lg transition disabled:opacity-60;
  }
</style>
