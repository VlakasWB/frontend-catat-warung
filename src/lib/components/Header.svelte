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

<header class="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur shadow-soft">
  <div>
    <p class="text-sm text-muted">Catat Warung</p>
    <h1 class="text-xl font-semibold text-fg">{$title}</h1>
  </div>
  <div class="flex items-center gap-3 text-xs text-muted">
    <span class="rounded-full border border-border px-2 py-1 text-fg">Online</span>
    <a class="font-semibold text-brand underline decoration-brand/50 decoration-2 underline-offset-4" href="/dashboard">Dashboard</a>
  </div>
</header>
