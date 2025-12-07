<script lang="ts">
  import '../app.css';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Header from '$lib/components/Header.svelte';
</script>

<div class="flex min-h-screen bg-bg text-fg">
  <Sidebar />
  <div class="flex flex-1 flex-col">
    <Header />
    <main class="flex-1 px-4 py-6 sm:px-6">
      <div class="mx-auto max-w-6xl">
        <slot />
      </div>
    </main>
  </div>
</div>
