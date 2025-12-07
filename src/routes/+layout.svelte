<script lang="ts">
  import '../app.css';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Header from '$lib/components/Header.svelte';
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 flex">
  <Sidebar />
  <div class="flex-1 flex flex-col">
    <Header />
    <main class="flex-1 px-4 sm:px-6 py-6">
      <div class="max-w-6xl mx-auto">
        <slot />
      </div>
    </main>
  </div>
</div>
