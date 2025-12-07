<script lang="ts">
  import type { PageData } from './$types';
  import type { OutputFile } from '$lib/types';

  export let data: PageData;

  let files: OutputFile[] = data.outputs.files ?? [];
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
      files = data.files ?? [];
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Gagal memuat output';
    } finally {
      loading = false;
    }
  };
</script>

<div class="space-y-6">
  <div class="card">
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-sm text-slate-400">Catat Warung</p>
        <h1 class="text-xl font-semibold text-slate-100">Output OCR</h1>
        <p class="text-sm text-slate-400">Daftar file anotasi, txt, atau json yang dihasilkan backend.</p>
      </div>
      <button class="ghost" type="button" on:click={refresh} disabled={loading}>
        {loading ? 'Memuat...' : 'Refresh'}
      </button>
    </div>
  </div>

  <div class="card overflow-x-auto">
    {#if errorMsg}
      <p class="text-sm text-rose-300 mb-3">{errorMsg}</p>
    {/if}
    {#if files.length === 0}
      <p class="text-sm text-slate-400">Belum ada output. Lakukan scan terlebih dahulu.</p>
    {:else}
      <table class="min-w-full text-sm text-slate-100">
        <thead class="text-left text-slate-400 border-b border-slate-800">
          <tr>
            <th class="py-2 pr-4">Nama</th>
            <th class="py-2 pr-4">Ukuran</th>
            <th class="py-2 pr-4">Terakhir diubah</th>
            <th class="py-2 pr-4">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {#each files as file}
            <tr class="border-b border-slate-800/60">
              <td class="py-2 pr-4">{file.name}</td>
              <td class="py-2 pr-4">{formatSize(file.size_bytes)}</td>
              <td class="py-2 pr-4 text-slate-400">{formatDate(file.modified_at)}</td>
              <td class="py-2 pr-4">
                <a class="pill-link" href={file.url} target="_blank" rel="noreferrer">Buka</a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<style>
  .ghost {
    border-radius: 10px;
    padding: 10px 12px;
    border: 1px solid #1f2937;
    background: rgba(17, 24, 39, 0.8);
    color: #e2e8f0;
    font-weight: 600;
  }
  .pill-link {
    display: inline-block;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid #0ea5e9;
    color: #bae6fd;
    font-weight: 600;
    transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
  }
  .pill-link:hover {
    background: rgba(14, 165, 233, 0.1);
    border-color: #38bdf8;
  }
</style>
