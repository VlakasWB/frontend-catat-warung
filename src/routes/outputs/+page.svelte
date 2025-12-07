<script lang="ts">
  import type { PageData } from './$types';
  import type { OutputFile } from '$lib/types';

  export let data: PageData;

  const onlyJpg = (items: OutputFile[] = []) => items.filter((file) => file.name?.toLowerCase().endsWith('.jpg'));

  let files: OutputFile[] = onlyJpg(data.outputs.files);
  let loading = false;
  let errorMsg: string | null = null;

  const formatSize = (bytes: number) => {
    if (!Number.isFinite(bytes)) return '-';
    if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
    if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString();
  };

  const refresh = async () => {
    loading = true;
    errorMsg = null;
    try {
      const response = await fetch('/api/scan/outputs');
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || 'Gagal mengambil daftar output');
      }
      const data = (await response.json()) as { files: OutputFile[] };
      files = onlyJpg(data.files);
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Gagal memuat output';
    } finally {
      loading = false;
    }
  };
</script>

<div class="space-y-8">
  <section class="brand-gradient rounded-2xl p-6 shadow-soft lg:p-8">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-white/90">Catat Warung</p>
        <h1 class="mt-1 text-3xl font-bold text-white">Output OCR</h1>
        <p class="text-base text-white/90">Daftar file anotasi, teks, atau json yang dihasilkan backend.</p>
      </div>
      <button
        class="inline-flex h-12 items-center justify-center rounded-2xl border border-white/60 bg-white/20 px-5 text-base font-semibold text-white backdrop-blur transition hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none disabled:opacity-60"
        type="button"
        on:click={refresh}
        disabled={loading}
      >
        {loading ? 'Memuat...' : 'Refresh'}
      </button>
    </div>
  </section>

  <section class="card overflow-x-auto">
    {#if errorMsg}
      <p class="mb-3 text-sm font-semibold text-error">{errorMsg}</p>
    {/if}
    {#if files.length === 0}
      <p class="text-sm text-muted">Belum ada output. Lakukan scan terlebih dahulu.</p>
    {:else}
      <table class="min-w-full text-sm text-fg">
        <thead class="bg-slate-50 text-left text-muted">
          <tr>
            <th class="px-3 py-3 font-semibold">Nama</th>
            <th class="px-3 py-3 font-semibold">Ukuran</th>
            <th class="px-3 py-3 font-semibold">Terakhir diubah</th>
            <th class="px-3 py-3 font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {#each files as file}
            <tr class="border-b border-border/70">
              <td class="px-3 py-3 align-top text-base font-semibold text-fg">{file.name}</td>
              <td class="px-3 py-3 align-top text-fg">{formatSize(file.size_bytes)}</td>
              <td class="px-3 py-3 align-top text-muted">{formatDate(file.modified_at)}</td>
              <td class="px-3 py-3 align-top">
                <a
                  class="inline-flex h-11 items-center justify-center rounded-2xl border border-brand/60 bg-brand/10 px-4 text-sm font-semibold text-brand hover:bg-brand/15 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Buka
                </a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </section>
</div>
