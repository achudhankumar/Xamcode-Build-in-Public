import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0b',
        surface: '#111113',
        'surface-elevated': '#18181b',
        border: '#27272a',
        accent: '#3b82f6',
        'accent-hover': '#2563eb',
        violet: '#8b5cf6',
        muted: '#71717a',
        'muted-gray': '#a1a1aa',
        foreground: '#fafafa',
        'foreground-muted': '#a1a1aa',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
    },
  },
  plugins: [],
};

export default config;
