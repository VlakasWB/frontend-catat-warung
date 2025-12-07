import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';

const config: UserConfig = {
  plugins: [sveltekit()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.{ts,js}'],
    environmentMatchGlobs: [['src/lib/server/**/*.{spec,test}.{ts,js}', 'node']]
  }
};

export default config;
