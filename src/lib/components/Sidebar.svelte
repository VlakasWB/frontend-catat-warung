<script lang="ts">
  import { page } from '$app/stores';
  import { derived } from 'svelte/store';

  const links = [
    { href: '/scan', label: 'Scan' },
    { href: '/review', label: 'Review' },
    { href: '/dashboard', label: 'Dashboard' }
  ];

  const activePath = derived(page, ($page) => $page.url.pathname);
</script>

<aside class="hidden md:flex md:flex-col w-60 h-screen sticky top-0 bg-slate-900/40 border-r border-slate-800/60 px-4 py-6 space-y-6">
  <div class="flex items-center gap-2">
    <div class="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/60 flex items-center justify-center text-sky-200 font-bold">
      CW
    </div>
    <div>
      <p class="text-slate-100 font-semibold">Catat Warung</p>
      <p class="text-xs text-slate-500">Mobile-first</p>
    </div>
  </div>

  <nav class="space-y-2">
    {#each links as link}
      {#if $activePath}
        <a
          class={`flex items-center gap-2 px-3 py-2 rounded-lg border transition ${
            $activePath.startsWith(link.href)
              ? 'border-sky-400/70 bg-sky-500/10 text-sky-100'
              : 'border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
          }`}
          href={link.href}
        >
          {link.label}
        </a>
      {/if}
    {/each}
  </nav>
</aside>
