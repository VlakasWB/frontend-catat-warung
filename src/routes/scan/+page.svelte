<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { Detection, ParsedRow, ScanResult } from '$lib/types';

  let file: File | null = null;
  let loading = false;
  let error: string | null = null;

  let scanData: ScanResult | null = null;
  let detections: Detection[] = [];
  let annotatedUrl: string | null = null;
  let rows: ParsedRow[] = [];
  let activeRow = 0;

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('scanResult');
  }

  const defaultRow = (): ParsedRow => ({
    date: '',
    item: '',
    qty: 1,
    unit: 'pcs',
    price: undefined,
    total: undefined,
    type: 'penjualan'
  });

  const ensureRow = (idx: number) => {
    if (idx < 0) return;
    rows = [...rows];
    while (rows.length <= idx) {
      rows = [...rows, defaultRow()];
    }
  };

  const onFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    file = target.files?.[0] ?? null;
  };

  const parseNumberFromText = (text: string): number | null => {
    const cleaned = text.replace(/[^\d.,-]/g, '').replace(',', '.').trim();
    if (!cleaned) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  };

  const applyDetectionToField = (detection: Detection, field: keyof ParsedRow) => {
    ensureRow(activeRow);
    const target = rows[activeRow];
    const next = { ...target };
    if (field === 'qty' || field === 'price' || field === 'total') {
      const num = parseNumberFromText(detection.text);
      if (num !== null) {
        (next as any)[field] = field === 'qty' ? num : Math.round(num);
      } else {
        (next as any)[field] = undefined;
      }
    } else {
      (next as any)[field] = detection.text;
    }
    rows = rows.map((r, idx) => (idx === activeRow ? next : r));
  };

  const updateField = (idx: number, field: keyof ParsedRow, value: string) => {
    ensureRow(idx);
    const next = { ...rows[idx] };
    if (field === 'qty' || field === 'price' || field === 'total') {
      const num = parseNumberFromText(value);
      (next as any)[field] = num ?? undefined;
    } else {
      (next as any)[field] = value;
    }
    rows = rows.map((r, i) => (i === idx ? next : r));
  };

  const addRow = () => {
    rows = [...rows, defaultRow()];
    activeRow = rows.length - 1;
  };

  const submit = async (event: Event) => {
    event.preventDefault();
    error = null;
    if (!file) {
      error = 'Pilih file gambar terlebih dahulu.';
      return;
    }
    loading = true;

    const formData = new FormData();
    formData.set('image', file);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        const cloned = response.clone();
        const json = await cloned.json().catch(() => null);
        const detail =
          (json && (json.detail || json.message)) ||
          (await response.text().catch(() => ''));
        throw new Error(detail || response.statusText || 'Gagal memproses gambar');
      }
      const data: ScanResult = await response.json();
      scanData = data;
      detections = data.detections ?? [];
      annotatedUrl = data.annotated_image_path ?? null;
      rows = (data.parsed ?? []).map((r) => ({ ...r }));
      if (rows.length === 0) rows = [defaultRow()];
      activeRow = 0;
      sessionStorage.setItem('scanResult', JSON.stringify(data));
    } catch (err) {
      error = err instanceof Error ? err.message : 'Terjadi kesalahan';
    } finally {
      loading = false;
    }
  };

  const proceedToReview = () => {
    if (!scanData) return;
    const payload = { ...scanData, parsed: rows };
    sessionStorage.setItem('scanResult', JSON.stringify(payload));
    goto('/review');
  };

  onMount(() => {
    // clear stale state
    sessionStorage.removeItem('scanResult');
  });
</script>

<div class="space-y-6">
  <div class="card gradient">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-muted">Catat Warung</p>
        <h1 class="text-xl font-semibold text-foreground">Scan & Simpan Nota</h1>
        <p class="text-muted text-sm">Unggah foto, proses OCR, lalu validasi sebelum simpan.</p>
      </div>
    </div>
  </div>

  <form class="card frosted space-y-4" data-testid="scan-form" on:submit|preventDefault={submit}>
    <div class="space-y-2">
      <label class="block text-sm text-foreground" for="image">Upload gambar nota</label>
      <div class="file-row">
        <input
          type="file"
          name="image"
          id="image"
          accept="image/*"
          class="sr-only"
          on:change={onFileChange}
          required
        />
        <label class="file-button" for="image">
          {file ? 'Ganti gambar' : 'Pilih gambar'}
        </label>
        <span class="file-name text-muted">{file ? file.name : 'Belum ada file'}</span>
      </div>
    </div>

    <button class="primary" disabled={loading} type="submit">
      {#if loading}
        Memproses...
      {:else}
        Proses nota
      {/if}
    </button>

    {#if error}
      <p class="text-error text-sm">{error}</p>
    {/if}
  </form>

  {#if scanData}
    <div class="card frosted space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-foreground">Hasil OCR & Mapping</h2>
          <p class="text-muted text-sm">Pilih hasil OCR dan tetapkan ke kolom/baris yang diinginkan.</p>
        </div>
      </div>

      {#if annotatedUrl}
        <div class="annotated-wrapper">
          <img src={annotatedUrl} alt="Annotated OCR" class="annotated-image" />
        </div>
      {/if}

      <div class="stacked">
        <div class="column">
          <h3 class="text-sm font-semibold text-foreground mb-2">Deteksi OCR</h3>
          {#if detections.length === 0}
            <p class="text-muted text-sm">Tidak ada deteksi terstruktur.</p>
          {:else}
            <div class="detects-horizontal">
              {#each detections as det}
                <div class="detect-card">
                  <div class="flex justify-between text-xs text-muted">
                    <span>#{det.index}</span>
                    {#if det.score !== undefined}
                      <span>score: {det.score?.toFixed(2)}</span>
                    {/if}
                  </div>
                  <p class="text-foreground text-sm">{det.text}</p>
                  <div class="detect-actions">
                    <button type="button" on:click={() => applyDetectionToField(det, 'date')}>Tanggal</button>
                    <button type="button" on:click={() => applyDetectionToField(det, 'item')}>Item</button>
                    <button type="button" on:click={() => applyDetectionToField(det, 'qty')}>Qty</button>
                    <button type="button" on:click={() => applyDetectionToField(det, 'price')}>Harga</button>
                    <button type="button" on:click={() => applyDetectionToField(det, 'total')}>Total</button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <div class="column">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-foreground">Baris yang akan disimpan</h3>
            <button class="ghost small" type="button" on:click={addRow}>Tambah baris</button>
          </div>
          <div class="rows horizontal">
            {#each rows as row, idx}
              <div
                class={`row ${idx === activeRow ? 'active' : ''}`}
                role="button"
                tabindex="0"
                on:click={() => (activeRow = idx)}
                on:keydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    activeRow = idx;
                  }
                }}
              >
                <div class="row-head">
                  <span class="badge">Row {idx + 1}</span>
                  {#if row.source}
                    <span class="badge ghost">{row.source}</span>
                  {/if}
                  {#if idx === activeRow}
                    <span class="badge primary-badge">Aktif</span>
                  {/if}
                </div>
                <div class="row-fields horizontal-fields">
                  <label>
                    <span>Tanggal</span>
                    <input
                      class="input"
                      placeholder="YYYY-MM-DD"
                      value={row.date}
                      on:input={(e) => updateField(idx, 'date', (e.target as HTMLInputElement).value)}
                    />
                  </label>
                  <label class="wide">
                    <span>Item</span>
                    <input
                      class="input"
                      placeholder="Nama barang"
                      value={row.item}
                      on:input={(e) => updateField(idx, 'item', (e.target as HTMLInputElement).value)}
                    />
                  </label>
                  <label>
                    <span>Qty</span>
                    <input
                      class="input"
                      type="number"
                      min="0"
                      step="1"
                      value={row.qty}
                      on:input={(e) => updateField(idx, 'qty', (e.target as HTMLInputElement).value)}
                    />
                  </label>
                  <label>
                    <span>Unit</span>
                    <input
                      class="input"
                      placeholder="pcs/kg"
                      value={row.unit ?? ''}
                      on:input={(e) => updateField(idx, 'unit', (e.target as HTMLInputElement).value)}
                    />
                  </label>
                  <label>
                    <span>Harga</span>
                    <input
                      class="input"
                      type="number"
                      min="0"
                      value={row.price ?? ''}
                      on:input={(e) => updateField(idx, 'price', (e.target as HTMLInputElement).value)}
                    />
                  </label>
                  <label>
                    <span>Total</span>
                    <input
                      class="input"
                      type="number"
                      min="0"
                      value={row.total ?? ''}
                      on:input={(e) => updateField(idx, 'total', (e.target as HTMLInputElement).value)}
                    />
                  </label>
                  <label>
                    <span>Type</span>
                    <select class="input" value={row.type ?? ''} on:change={(e) => updateField(idx, 'type', (e.target as HTMLSelectElement).value)}>
                      <option value="penjualan">Penjualan</option>
                      <option value="pengeluaran">Pengeluaran</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </label>
                </div>
              </div>
            {/each}
          </div>
          <div class="mt-3 flex justify-end gap-2">
            <button class="primary" type="button" on:click={proceedToReview}>Simpan & lanjut ke review</button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(:root) {
    --bg: #050816;
    --surface: #0f172a;
    --surface-muted: #111827;
    --text: #e2e8f0;
    --muted: #94a3b8;
    --primary: linear-gradient(90deg, #22d3ee, #2563eb);
    --border: #1f2937;
    color-scheme: dark;
  }
  :global(body) {
    background: var(--bg);
    color: var(--text);
    transition: background 0.2s ease, color 0.2s ease;
  }
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 16px;
    box-shadow: 0 10px 35px rgba(0, 0, 0, 0.12);
  }
  .gradient {
    background: radial-gradient(circle at 20% 20%, rgba(96, 165, 250, 0.15), transparent 30%),
      radial-gradient(circle at 80% 0%, rgba(14, 165, 233, 0.2), transparent 35%),
      var(--surface);
  }
  .frosted {
    backdrop-filter: blur(12px);
  }
  .text-foreground {
    color: var(--text);
  }
  .text-muted {
    color: var(--muted);
  }
  .primary {
    width: 100%;
    border: none;
    border-radius: 12px;
    padding: 14px;
    font-weight: 700;
    color: #ffffff;
    background-image: var(--primary);
    transition: transform 0.1s ease, box-shadow 0.2s ease, opacity 0.2s ease;
    box-shadow: 0 12px 24px rgba(37, 99, 235, 0.25);
  }
  .primary:disabled {
    opacity: 0.6;
  }
  .primary:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 16px 32px rgba(34, 211, 238, 0.28);
  }
  .ghost {
    border-radius: 10px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    background: var(--surface-muted);
    color: var(--text);
    font-weight: 600;
  }
  .file-row {
    display: flex;
    gap: 10px;
    align-items: center;
    background: var(--surface-muted);
    border: 1px dashed var(--border);
    border-radius: 12px;
    padding: 10px 12px;
  }
  .file-button {
    cursor: pointer;
    background-image: var(--primary);
    color: #ffffff;
    font-weight: 700;
    padding: 10px 14px;
    border-radius: 10px;
    border: none;
    box-shadow: 0 8px 18px rgba(37, 99, 235, 0.25);
    transition: transform 0.1s ease, box-shadow 0.2s ease;
  }
  .file-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 26px rgba(34, 211, 238, 0.28);
  }
  .file-name {
    flex: 1;
    font-size: 0.9rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .text-error {
    color: #f87171;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .annotated-wrapper {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 10px;
    background: var(--surface-muted);
  }
  .annotated-image {
    width: 100%;
    border-radius: 8px;
    object-fit: contain;
  }
  .grid-cols {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 16px;
  }
  .column {
    background: var(--surface-muted);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px;
  }
  .detections {
    display: grid;
    gap: 10px;
    max-height: 420px;
    overflow-y: auto;
  }
  .detect-card {
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px;
    background: var(--surface);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .detects-horizontal {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(220px, 1fr);
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 6px;
  }
  .detect-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .detect-actions button {
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 12px;
    background: var(--surface-muted);
    color: var(--text);
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 460px;
    overflow-y: auto;
  }
  .row {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 10px;
    background: var(--surface);
    cursor: pointer;
  }
  .row.active {
    border-color: #22d3ee;
    box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.4);
  }
  .row-head {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-bottom: 8px;
  }
  .badge {
    border-radius: 999px;
    padding: 4px 8px;
    border: 1px solid var(--border);
    color: var(--muted);
    font-size: 12px;
  }
  .badge.ghost {
    background: var(--surface-muted);
  }
  .primary-badge {
    border-color: rgba(34, 211, 238, 0.7);
    color: #22d3ee;
  }
  .row-fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 8px;
  }
  .row-fields.horizontal-fields {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }
  .row-fields label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: var(--muted);
  }
  .row-fields label.wide {
    grid-column: span 2;
  }
  .stacked {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
</style>
