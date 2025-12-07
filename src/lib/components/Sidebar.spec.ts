import { cleanup, render, screen } from '@testing-library/svelte/svelte5';
import { tick } from 'svelte';
import { writable } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Sidebar from './Sidebar.svelte';

var pageStore: ReturnType<typeof writable<{ url: URL }>>;
vi.mock('$app/stores', () => {
  pageStore = writable<{ url: URL }>({ url: new URL('http://localhost/scan') });
  return { page: pageStore };
});

const setPath = async (path: string) => {
  pageStore.set({ url: new URL(`http://localhost${path}`) });
  await tick();
};

describe('Sidebar component', () => {
  beforeEach(async () => {
    await setPath('/scan');
  });

  afterEach(() => {
    cleanup();
  });

  it('highlights the active link for the current route', async () => {
    render(Sidebar);
    const scanLink = screen.getByRole('link', { name: 'Scan' });
    expect(scanLink.className).toContain('border-sky-400/70');

    await setPath('/dashboard');
    const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
    expect(dashboardLink.className).toContain('border-sky-400/70');
    expect(scanLink.className).not.toContain('border-sky-400/70');
  });

  it('renders all navigation links', () => {
    render(Sidebar);
    ['Scan', 'Review', 'Dashboard'].forEach((label) => {
      expect(screen.getByRole('link', { name: label })).toBeTruthy();
    });
  });
});
