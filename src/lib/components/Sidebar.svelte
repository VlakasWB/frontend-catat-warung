<script lang="ts">
  import { page } from '$app/stores';
  import { derived } from 'svelte/store';

  const links = [
    { href: '/scan', label: 'Scan' },
    { href: '/review', label: 'Review' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/outputs', label: 'Outputs' }
  ];

  const activePath = derived(page, ($page) => $page.url.pathname);
</script>

<aside class="sticky top-0 hidden h-screen w-60 md:flex md:flex-col border-r border-border bg-card/90 px-4 py-6 space-y-6 shadow-soft">
  <div class="flex items-center gap-3">
    <div class="brand-gradient flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold shadow-soft">
      CW
    </div>
    <div>
      <p class="font-semibold text-fg">Catat Warung</p>
      <p class="text-xs text-muted">Mobile-first</p>
    </div>
  </div>

  <nav class="space-y-2">
    {#each links as link}
      {#if $activePath}
        <a
          class={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
            $activePath.startsWith(link.href)
              ? 'border-brand bg-brand/5 text-brand'
              : 'border-transparent text-muted hover:border-border hover:bg-slate-100'
          }`}
          href={link.href}
        >
          {link.label}
        </a>
      {/if}
    {/each}
  </nav>
</aside>
