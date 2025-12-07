/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        card: 'var(--card)',
        border: 'var(--border)',
        fg: 'var(--fg)',
        muted: 'var(--muted)',
        brand: 'var(--brand)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)'
      },
      borderRadius: {
        '2xl': '16px'
      },
      boxShadow: {
        soft: '0 8px 24px rgba(2,6,23,.06)'
      }
    }
  },
  plugins: []
};
