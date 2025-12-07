<script lang="ts">
  import { page } from '$app/stores';
  import { derived } from 'svelte/store';

  const title = derived(page, ($page) => {
    if ($page.url.pathname.startsWith('/scan')) return 'Scan Nota';
    if ($page.url.pathname.startsWith('/review')) return 'Review';
    if ($page.url.pathname.startsWith('/dashboard')) return 'Dashboard';
    return 'Catat Warung';
  });
</script>

<header class="sticky top-0 z-10 bg-slate-900/50 backdrop-blur border-b border-slate-800/70 px-4 py-3 flex items-center justify-between">
  <div>
    <p class="text-sm text-slate-400">Catat Warung</p>
    <h1 class="text-xl font-semibold text-slate-100">{$title}</h1>
  </div>
  <div class="flex gap-3 items-center text-xs text-slate-400">
    <span class="px-2 py-1 rounded-full border border-slate-700">Online</span>
    <a class="underline text-sky-300" href="/dashboard">Dashboard</a>
  </div>
</header>
