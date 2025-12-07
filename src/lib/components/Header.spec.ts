import { cleanup, render, screen } from '@testing-library/svelte/svelte5';
import { tick } from 'svelte';
import { writable } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Header from './Header.svelte';

var pageStore: ReturnType<typeof writable<{ url: URL }>>;
vi.mock('$app/stores', () => {
  pageStore = writable<{ url: URL }>({ url: new URL('http://localhost/') });
  return { page: pageStore };
});

const setPath = async (path: string) => {
  pageStore.set({ url: new URL(`http://localhost${path}`) });
  await tick();
};

describe('Header component', () => {
  beforeEach(async () => {
    await setPath('/');
  });

  afterEach(() => {
    cleanup();
  });

  it('updates the title based on the current route', async () => {
    render(Header);

    await setPath('/scan');
    expect(screen.getByRole('heading', { name: 'Scan Nota' })).toBeTruthy();

    await setPath('/review');
    expect(screen.getByRole('heading', { name: 'Review' })).toBeTruthy();

    await setPath('/dashboard');
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy();
  });

  it('falls back to the default title for unknown paths', async () => {
    render(Header);

    await setPath('/other');
    expect(screen.getAllByText('Catat Warung').length).toBeGreaterThan(0);
  });
});
