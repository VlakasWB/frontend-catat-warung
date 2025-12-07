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
  let detectionPage = 0;
  const detectionsPerPage = 6;
  let pagedDetections: Detection[] = [];
  let totalDetectionPages = 1;

  $: totalDetectionPages = Math.max(1, Math.ceil((detections?.length ?? 0) / detectionsPerPage));
  $: detectionPage = Math.min(detectionPage, Math.max(0, totalDetectionPages - 1));
  $: pagedDetections = detections.slice(
    detectionPage * detectionsPerPage,
    detectionPage * detectionsPerPage + detectionsPerPage
  );

  const nextDetectionPage = () => {
    detectionPage = Math.min(totalDetectionPages - 1, detectionPage + 1);
  };

  const prevDetectionPage = () => {
    detectionPage = Math.max(0, detectionPage - 1);
  };

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
    type: 'penjualan',
    phone: '',
    address: ''
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
    if (!text) return null;

    const withoutCurrency = text.replace(/rp|idr/gi, '').replace(/-/g, '');
    const keepSeparators = withoutCurrency.replace(/[^\d.,]/g, '');
    if (!keepSeparators) return null;

    const hasDot = keepSeparators.includes('.');
    const hasComma = keepSeparators.includes(',');
    let normalized = keepSeparators;

    if (hasDot && hasComma) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else if (hasComma) {
      normalized = /,\d{1,2}$/.test(normalized) ? normalized.replace(',', '.') : normalized.replace(/,/g, '');
    } else if (hasDot) {
      normalized = /\.\d{1,2}$/.test(normalized) ? normalized : normalized.replace(/\./g, '');
    }

    const num = Number(normalized);
    return Number.isFinite(num) ? num : null;
  };

  const normalizeDate = (text: string): string | null => {
    const match = text.match(/(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4})/);
    if (!match) return null;
    const raw = match[1].replace(/\./g, '-').replace(/\//g, '-');
    const parts = raw.split('-').map((p) => p.padStart(2, '0'));
    if (parts.length !== 3) return null;
    let year = '';
    let month = '';
    let day = '';
    if (parts[0].length === 4) {
      [year, month, day] = parts;
    } else if (parts[2].length === 4) {
      [day, month, year] = parts;
    } else {
      [day, month, year] = parts;
      year = year.length === 2 ? `20${year}` : year;
    }
    const mm = Number(month);
    const dd = Number(day);
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
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
    } else if (field === 'date') {
      const parsed = normalizeDate(detection.text);
      (next as any)[field] = parsed ?? detection.text;
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

  const onDragStart = (event: DragEvent, detection: Detection) => {
    event.dataTransfer?.setData('application/json', JSON.stringify(detection));
    event.dataTransfer?.setData('text/plain', detection.text);
  };

  const tryAutofillDate = (dets: Detection[]) => {
    const candidate = dets.map((d) => normalizeDate(d.text)).find((val) => val !== null);
    if (candidate) {
      ensureRow(activeRow);
      rows = rows.map((r, idx) => (idx === activeRow && !r.date ? { ...r, date: candidate as string } : r));
    }
  };

  const onDropField = (event: DragEvent, field: keyof ParsedRow) => {
    event.preventDefault();
    const raw = event.dataTransfer?.getData('application/json');
    if (!raw) return;
    try {
      const detection = JSON.parse(raw) as Detection;
      applyDetectionToField(detection, field);
    } catch {
      /* ignore */
    }
  };

  const addRow = () => {
    rows = [...rows, defaultRow()];
    activeRow = rows.length - 1;
  };

  const removeRow = (idx: number) => {
    rows = rows.filter((_, i) => i !== idx);
    if (rows.length === 0) {
      rows = [defaultRow()];
      activeRow = 0;
      return;
    }
    if (activeRow >= rows.length) activeRow = Math.max(0, rows.length - 1);
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
        const detail = (json && (json.detail || json.message)) || (await response.text().catch(() => ''));
        throw new Error(detail || response.statusText || 'Gagal memproses gambar');
      }
      const data: ScanResult = await response.json();
      scanData = data;
      detections = data.detections ?? [];
      annotatedUrl = data.annotated_image_path ?? null;
      rows = (data.parsed ?? []).map((r) => ({ ...r }));
      if (rows.length === 0) rows = [defaultRow()];
      activeRow = 0;
      detectionPage = 0;
      tryAutofillDate(detections);
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
    sessionStorage.removeItem('scanResult');
  });

  const inputClass =
    'h-12 w-full rounded-2xl border border-border bg-white px-4 text-[16px] text-fg placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/40 focus:outline-none';
  const textareaClass =
    'w-full rounded-2xl border border-border bg-white px-4 py-3 text-[16px] text-fg placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/40 focus:outline-none';
</script>

<main class="mx-auto max-w-6xl space-y-8 pb-16">
  <section class="brand-gradient rounded-2xl p-6 shadow-soft lg:p-8">
    <p class="text-sm font-medium text-white/90">Catat Warung</p>
    <h1 class="mt-1 text-3xl font-bold text-white">Scan & Simpan Nota</h1>
    <p class="mt-2 max-w-3xl text-base text-white/90">
      Unggah foto nota, proses OCR, lalu validasi sebelum disimpan. Tampilan terang dengan teks lebih besar agar mudah dibaca
      pemilik warung.
    </p>
    <div class="mt-4 flex flex-wrap gap-3 text-sm text-white/90">
      <span class="inline-flex items-center rounded-full bg-white/15 px-3 py-1">1. Unggah & proses</span>
      <span class="inline-flex items-center rounded-full bg-white/15 px-3 py-1">2. Drag hasil OCR</span>
      <span class="inline-flex items-center rounded-full bg-white/15 px-3 py-1">3. Review & simpan</span>
    </div>
  </section>

  <form class="card space-y-6" data-testid="scan-form" on:submit|preventDefault={submit}>
    <div class="space-y-2">
      <label class="block text-sm font-semibold text-fg" for="image">Upload gambar nota</label>
      <p class="text-sm text-muted">Gunakan foto tajam. Format: JPG/PNG. Maks 10MB.</p>
      <div class="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-white/70 p-4 sm:flex-row sm:items-center">
        <input
          type="file"
          name="image"
          id="image"
          accept="image/*"
          class="sr-only"
          on:change={onFileChange}
          required
        />
        <label
          class="brand-gradient inline-flex h-12 cursor-pointer items-center justify-center rounded-2xl px-5 text-base font-semibold text-white shadow-soft transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
          for="image"
        >
          {file ? 'Ganti gambar' : 'Pilih gambar'}
        </label>
        <span class="text-sm text-muted sm:flex-1">{file ? file.name : 'Belum ada file dipilih'}</span>
      </div>
    </div>

    <button
      class="brand-gradient h-14 w-full rounded-2xl px-6 text-lg font-semibold text-white shadow-soft transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none disabled:opacity-60"
      disabled={loading}
      type="submit"
    >
      {#if loading}
        Memproses...
      {:else}
        Proses nota
      {/if}
    </button>

    {#if error}
      <p class="text-sm font-medium text-error">{error}</p>
    {/if}
  </form>

  {#if scanData}
    <div class="grid gap-6 lg:grid-cols-[380px,1fr]">
      <section class="card space-y-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-xl font-semibold text-fg">Deteksi OCR</h2>
            <p class="text-sm text-muted">Tarik ke kolom tujuan atau klik tombol cepat.</p>
          </div>
          <div class="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm text-fg">
            Hal {detections.length === 0 ? 0 : detectionPage + 1}/{totalDetectionPages}
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            class="h-11 rounded-2xl border border-border bg-white px-4 text-sm font-semibold text-fg hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none disabled:opacity-60"
            type="button"
            on:click={prevDetectionPage}
            disabled={detectionPage === 0}
          >
            Sebelumnya
          </button>
          <button
            class="h-11 rounded-2xl border border-border bg-white px-4 text-sm font-semibold text-fg hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none disabled:opacity-60"
            type="button"
            on:click={nextDetectionPage}
            disabled={detectionPage >= totalDetectionPages - 1}
          >
            Selanjutnya
          </button>
        </div>

        {#if detections.length === 0}
          <div class="rounded-2xl border border-border bg-bg px-4 py-6 text-sm text-muted">
            Tidak ada deteksi terstruktur. Coba unggah ulang foto dengan pencahayaan lebih terang.
          </div>
        {:else}
          <div class="space-y-3">
            {#each pagedDetections as det}
              <div
                class="rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:border-brand/40 focus-within:ring-2 focus-within:ring-brand/40"
                role="button"
                tabindex="0"
                draggable="true"
                on:dragstart={(e) => onDragStart(e, det)}
                on:keydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onDragStart(e as unknown as DragEvent, det);
                  }
                }}
              >
                <div class="flex items-center justify-between text-sm text-muted">
                  <span>#{det.index}</span>
                  {#if det.score !== undefined}
                    <span>skor: {det.score?.toFixed(2)}</span>
                  {/if}
                </div>
                <p class="mt-2 text-base font-semibold text-fg">{det.text}</p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <button
                    class="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-bg px-3 py-2 text-sm font-semibold text-fg hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                    type="button"
                    on:click={() => applyDetectionToField(det, 'date')}
                  >
                    Tanggal
                  </button>
                  <button
                    class="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-bg px-3 py-2 text-sm font-semibold text-fg hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                    type="button"
                    on:click={() => applyDetectionToField(det, 'item')}
                  >
                    Nama Barang
                  </button>
                  <button
                    class="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-bg px-3 py-2 text-sm font-semibold text-fg hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                    type="button"
                    on:click={() => applyDetectionToField(det, 'qty')}
                  >
                    Jumlah
                  </button>
                  <button
                    class="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-bg px-3 py-2 text-sm font-semibold text-fg hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                    type="button"
                    on:click={() => applyDetectionToField(det, 'price')}
                  >
                    Harga
                  </button>
                  <button
                    class="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-bg px-3 py-2 text-sm font-semibold text-fg hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                    type="button"
                    on:click={() => applyDetectionToField(det, 'total')}
                  >
                    Total
                  </button>
                  <button
                    class="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-bg px-3 py-2 text-sm font-semibold text-fg hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                    type="button"
                    on:click={() => applyDetectionToField(det, 'phone')}
                  >
                    No. HP
                  </button>
                  <button
                    class="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-bg px-3 py-2 text-sm font-semibold text-fg hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                    type="button"
                    on:click={() => applyDetectionToField(det, 'address')}
                  >
                    Alamat
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}

        {#if annotatedUrl}
          <div class="rounded-2xl border border-border bg-card p-3 shadow-soft">
            <p class="mb-2 text-sm font-semibold text-fg">Pratinjau anotasi OCR</p>
            <img src={annotatedUrl} alt="Annotated OCR" class="h-auto w-full rounded-xl border border-border object-contain" />
          </div>
        {/if}
      </section>

      <section class="space-y-4">
        <div class="card space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-xl font-semibold text-fg">Baris yang akan disimpan</h3>
              <p class="text-sm text-muted">Klik baris untuk aktif, semua input tinggi 48px.</p>
            </div>
            <button
              class="h-11 rounded-2xl border border-border bg-white px-4 text-sm font-semibold text-fg hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
              type="button"
              on:click={addRow}
            >
              Tambah baris
            </button>
          </div>

          <div class="flex flex-col gap-4">
            {#each rows as row, idx}
              <div
                class={`rounded-2xl border bg-card p-4 shadow-soft transition hover:border-brand/40 focus-within:ring-2 focus-within:ring-brand/40 ${idx === activeRow ? 'border-brand' : 'border-border'}`}
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
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-2 text-sm text-muted">
                    <span class="rounded-full bg-slate-100 px-3 py-1 text-fg">Baris {idx + 1}</span>
                    {#if idx === activeRow}
                      <span class="rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">Aktif</span>
                    {/if}
                  </div>
                  <button
                    class="inline-flex h-11 items-center justify-center rounded-2xl border border-error/50 px-4 text-sm font-semibold text-error hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                    type="button"
                    on:click={(e) => {
                      e.stopPropagation();
                      removeRow(idx);
                    }}
                  >
                    Hapus
                  </button>
                </div>

                <div class="mt-4 grid gap-4 md:grid-cols-2">
                  <div on:dragover|preventDefault on:drop={(e) => onDropField(e, 'date')}>
                    <label class="block text-sm font-semibold text-fg" for={`tanggal-${idx}`}>Tanggal</label>
                    <input
                      id={`tanggal-${idx}`}
                      class={inputClass}
                      placeholder="YYYY-MM-DD"
                      value={row.date}
                      on:input={(e) => updateField(idx, 'date', (e.target as HTMLInputElement).value)}
                    />
                    <p class="mt-1 text-xs text-muted">Format: YYYY-MM-DD</p>
                  </div>
                  <div on:dragover|preventDefault on:drop={(e) => onDropField(e, 'item')}>
                    <label class="block text-sm font-semibold text-fg" for={`item-${idx}`}>Nama barang</label>
                    <input
                      id={`item-${idx}`}
                      class={inputClass}
                      placeholder="Nama barang"
                      value={row.item}
                      on:input={(e) => updateField(idx, 'item', (e.target as HTMLInputElement).value)}
                    />
                  </div>
                  <div class="grid gap-4 md:col-span-2 md:grid-cols-2">
                    <div on:dragover|preventDefault on:drop={(e) => onDropField(e, 'qty')}>
                      <label class="block text-sm font-semibold text-fg" for={`qty-${idx}`}>Qty</label>
                      <input
                        id={`qty-${idx}`}
                        class={inputClass}
                        type="number"
                        min="0"
                        step="1"
                        value={row.qty}
                        on:input={(e) => updateField(idx, 'qty', (e.target as HTMLInputElement).value)}
                      />
                    </div>
                    <div on:dragover|preventDefault on:drop={(e) => onDropField(e, 'unit')}>
                      <label class="block text-sm font-semibold text-fg" for={`unit-${idx}`}>Unit</label>
                      <input
                        id={`unit-${idx}`}
                        class={inputClass}
                        placeholder="pcs/kg"
                        value={row.unit ?? ''}
                        on:input={(e) => updateField(idx, 'unit', (e.target as HTMLInputElement).value)}
                      />
                      <p class="mt-1 text-xs text-muted">Gunakan singkatan sederhana.</p>
                    </div>
                  </div>
                  <div class="grid gap-4 md:col-span-2 md:grid-cols-2">
                    <div on:dragover|preventDefault on:drop={(e) => onDropField(e, 'price')}>
                      <label class="block text-sm font-semibold text-fg" for={`price-${idx}`}>Harga</label>
                      <input
                        id={`price-${idx}`}
                        class={inputClass}
                        type="number"
                        min="0"
                        value={row.price ?? ''}
                        on:input={(e) => updateField(idx, 'price', (e.target as HTMLInputElement).value)}
                      />
                    </div>
                    <div on:dragover|preventDefault on:drop={(e) => onDropField(e, 'total')}>
                      <label class="block text-sm font-semibold text-fg" for={`total-${idx}`}>Total</label>
                      <input
                        id={`total-${idx}`}
                        class={inputClass}
                        type="number"
                        min="0"
                        value={row.total ?? ''}
                        on:input={(e) => updateField(idx, 'total', (e.target as HTMLInputElement).value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-fg" for={`type-${idx}`}>Type</label>
                    <select
                      id={`type-${idx}`}
                      class={inputClass}
                      value={row.type ?? ''}
                      on:change={(e) => updateField(idx, 'type', (e.target as HTMLSelectElement).value)}
                    >
                      <option value="penjualan">Penjualan</option>
                      <option value="pengeluaran">Pengeluaran</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div on:dragover|preventDefault on:drop={(e) => onDropField(e, 'phone')}>
                    <label class="block text-sm font-semibold text-fg" for={`phone-${idx}`}>No. HP</label>
                    <input
                      id={`phone-${idx}`}
                      class={inputClass}
                      placeholder="08123456789"
                      value={row.phone ?? ''}
                      on:input={(e) => updateField(idx, 'phone', (e.target as HTMLInputElement).value)}
                    />
                    <p class="mt-1 text-xs text-muted">Gunakan 10-13 digit tanpa spasi.</p>
                  </div>
                  <div class="md:col-span-2" on:dragover|preventDefault on:drop={(e) => onDropField(e, 'address')}>
                    <label class="block text-sm font-semibold text-fg" for={`address-${idx}`}>Alamat</label>
                    <textarea
                      id={`address-${idx}`}
                      class={textareaClass}
                      rows="2"
                      placeholder="Alamat lengkap"
                      value={row.address ?? ''}
                      on:input={(e) => updateField(idx, 'address', (e.target as HTMLTextAreaElement).value)}
                    ></textarea>
                  </div>
                </div>
              </div>
            {/each}
          </div>

          <div class="pt-2">
            <button
              class="brand-gradient flex h-14 w-full items-center justify-center rounded-2xl px-6 text-lg font-semibold text-white shadow-soft transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none disabled:opacity-60"
              type="button"
              on:click={proceedToReview}
            >
              Simpan & lanjut ke review
            </button>
          </div>
        </div>

        <div class="card space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-fg">Contoh format pengisian</h3>
            <p class="text-sm text-muted">Label di atas input, helper jelas, dan error berwarna merah.</p>
          </div>
          <div class="space-y-6">
            <div>
              <label for="tanggal-contoh" class="mb-1 block text-sm font-semibold text-fg">Tanggal</label>
              <input id="tanggal-contoh" type="date" class={inputClass} value="2025-01-01" />
              <p class="mt-1 text-xs text-muted">Format: YYYY-MM-DD</p>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label for="item-contoh" class="mb-1 block text-sm font-semibold text-fg">Item</label>
                <input id="item-contoh" type="text" class={inputClass} placeholder="Nama barang" value="Beras Ramos" />
              </div>
              <div>
                <label for="qty-contoh" class="mb-1 block text-sm font-semibold text-fg">Qty</label>
                <input id="qty-contoh" type="number" inputmode="decimal" class={inputClass} value="2" />
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-3">
              <div>
                <label class="mb-1 block text-sm font-semibold text-fg" for="unit-contoh">Unit</label>
                <input id="unit-contoh" type="text" class={inputClass} value="kg" />
                <p class="mt-1 text-xs text-muted">Gunakan singkatan sederhana.</p>
              </div>
              <div>
                <label class="mb-1 block text-sm font-semibold text-fg" for="harga-contoh">Harga</label>
                <input
                  id="harga-contoh"
                  type="number"
                  class={`${inputClass} border-error focus:border-error focus:ring-error/30`}
                  value=""
                  placeholder="0"
                />
                <p class="mt-1 text-xs font-semibold text-error">Harus diisi. Contoh: 25000</p>
              </div>
              <div>
                <label class="mb-1 block text-sm font-semibold text-fg" for="type-contoh">Type</label>
                <select id="type-contoh" class={inputClass} value="penjualan">
                  <option value="penjualan">Penjualan</option>
                  <option value="pengeluaran">Pengeluaran</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  {/if}
</main>
