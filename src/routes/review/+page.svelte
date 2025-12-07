<script lang="ts">
  import { goto } from '$app/navigation';
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

  const toNumberOrUndefined = (value: string) => {
    const parsed = Number(value);
    return value === '' || !Number.isFinite(parsed) ? undefined : parsed;
  };

  const updateField = (idx: number, field: keyof ParsedRow, value: string) => {
    rows = rows.map((row, i) =>
      i === idx
        ? {
            ...row,
            [field]:
              field === 'qty' || field === 'price' || field === 'total' ? toNumberOrUndefined(value) : value
          }
        : row
    );
  };

  const save = async () => {
    if (rows.length === 0) return;
    saving = true;
    status = null;
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows })
      });
      if (response.ok) {
        status = 'Tersimpan ke database.';
        sessionStorage.removeItem('scanResult');
        goto('/dashboard');
      } else {
        status = 'Gagal simpan.';
      }
    } catch (err) {
      status = err instanceof Error ? err.message : 'Gagal simpan.';
    } finally {
      saving = false;
    }
  };

  const inputClass =
    'h-12 w-full rounded-2xl border border-border bg-white px-4 text-[16px] text-fg placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/40 focus:outline-none';
</script>

<main class="mx-auto max-w-6xl space-y-8 pb-16">
  <section class="brand-gradient rounded-2xl p-6 shadow-soft lg:p-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white">Review & Validasi</h1>
        <p class="mt-2 max-w-3xl text-base text-white/90">Tandai benar/salah, edit inline, lalu simpan ke database.</p>
      </div>
      {#if scan}
        <span class="inline-flex items-center rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
          {scan.used_llm ? 'Groq LLM aktif' : 'Rule-based'}
        </span>
      {/if}
    </div>
  </section>

  <section class="card space-y-4 overflow-x-auto">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-semibold text-fg">Baris terdeteksi</h2>
        <p class="text-sm text-muted">Semua input tinggi 48px, fokus jelas, dan teks kontras tinggi.</p>
      </div>
      <p class="text-sm text-muted">
        Total baris: <span class="font-semibold text-fg">{rows.length}</span>
      </p>
    </div>

    <table class="min-w-full text-sm text-fg">
      <thead class="bg-slate-50 text-left text-muted">
        <tr>
          <th class="px-3 py-2 font-semibold">Tanggal</th>
          <th class="px-3 py-2 font-semibold">Item</th>
          <th class="px-3 py-2 font-semibold">Qty</th>
          <th class="px-3 py-2 font-semibold">Unit</th>
          <th class="px-3 py-2 font-semibold">Harga</th>
          <th class="px-3 py-2 font-semibold">Total</th>
          <th class="px-3 py-2 font-semibold">Type</th>
          <th class="px-3 py-2 font-semibold">Aksi</th>
        </tr>
      </thead>
      <tbody>
        {#if rows.length === 0}
          <tr>
            <td colspan="8" class="px-3 py-6 text-center text-muted">Belum ada hasil. Mulai dari halaman scan.</td>
          </tr>
        {:else}
          {#each rows as row, idx}
            <tr class="border-b border-border/70">
              <td class="px-3 py-2">
                <input
                  class={inputClass}
                  value={row.date}
                  on:input={(e) => updateField(idx, 'date', (e.target as HTMLInputElement).value)}
                />
                <p class="mt-1 text-xs text-muted">Format: YYYY-MM-DD</p>
              </td>
              <td class="px-3 py-2">
                <input
                  class={inputClass}
                  value={row.item}
                  on:input={(e) => updateField(idx, 'item', (e.target as HTMLInputElement).value)}
                />
              </td>
              <td class="px-3 py-2 w-28">
                <input
                  class={inputClass}
                  type="number"
                  value={row.qty}
                  on:input={(e) => updateField(idx, 'qty', (e.target as HTMLInputElement).value)}
                />
              </td>
              <td class="px-3 py-2 w-32">
                <input
                  class={inputClass}
                  value={row.unit ?? ''}
                  on:input={(e) => updateField(idx, 'unit', (e.target as HTMLInputElement).value)}
                />
              </td>
              <td class="px-3 py-2 w-32">
                <input
                  class={inputClass}
                  type="number"
                  value={row.price ?? ''}
                  on:input={(e) => updateField(idx, 'price', (e.target as HTMLInputElement).value)}
                />
              </td>
              <td class="px-3 py-2 w-32">
                <input
                  class={inputClass}
                  type="number"
                  value={row.total ?? ''}
                  on:input={(e) => updateField(idx, 'total', (e.target as HTMLInputElement).value)}
                />
              </td>
              <td class="px-3 py-2 w-36">
                <select
                  class={inputClass}
                  value={row.type ?? ''}
                  on:change={(e) => updateField(idx, 'type', (e.target as HTMLSelectElement).value)}
                >
                  <option value="penjualan">Penjualan</option>
                  <option value="pengeluaran">Pengeluaran</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </td>
              <td class="px-3 py-2">
                <div class="flex flex-wrap gap-2">
                  <button
                    class="inline-flex h-11 items-center justify-center rounded-2xl border border-success/40 bg-emerald-50 px-4 text-sm font-semibold text-success hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                    on:click={() => markValid(idx)}
                    type="button"
                  >
                    Benar
                  </button>
                  <button
                    class="inline-flex h-11 items-center justify-center rounded-2xl border border-error/40 bg-rose-50 px-4 text-sm font-semibold text-error hover:bg-rose-100 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                    on:click={() => removeRow(idx)}
                    type="button"
                  >
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </section>

  <div class="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft md:flex-row md:items-center md:justify-between">
    <div class="space-y-1">
      <p class="text-base font-semibold text-fg">Siap simpan?</p>
      <p class="text-sm text-muted">
        Pastikan kolom terisi jelas. Tap target 56px untuk tombol utama agar mudah ditekan.
      </p>
      {#if saving}
        <p class="text-sm font-semibold text-brand">Menyimpan ke database, mohon tunggu...</p>
      {:else if status}
        <p class="text-sm font-semibold text-muted">{status}</p>
      {/if}
    </div>
    <div class="flex w-full flex-col gap-2 md:w-auto md:flex-row">
      <button
        class="h-14 w-full rounded-2xl border border-border bg-white px-5 text-base font-semibold text-fg hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none md:w-44"
        type="button"
        on:click={() => goto('/scan')}
      >
        Kembali ke scan
      </button>
      <button
        class="brand-gradient h-14 w-full rounded-2xl px-6 text-base font-semibold text-white shadow-soft transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none disabled:opacity-60 md:w-48"
        on:click={save}
        disabled={rows.length === 0 || saving}
        type="button"
      >
        {#if saving}
          Menyimpan...
        {:else}
          Simpan data
        {/if}
      </button>
    </div>
  </div>
</main>
