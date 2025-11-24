import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Lucent Agent Light Theme Palette
        // Background: soft white base (#FAFAFA) or pure white surfaces
        background: {
          DEFAULT: '#FAFAFA',
          surface: '#FFFFFF',
        },
        // Borders/dividers: neutral gray (#E5E7EB)
        border: {
          DEFAULT: '#E5E7EB',
          light: '#F3F4F6',
        },
        // Accent color: electric blue or cyan for actions and highlights
        accent: {
          DEFAULT: '#3B82F6', // electric blue
          light: '#60A5FA',
          dark: '#2563EB',
          cyan: '#06B6D4',
        },
        // Semantic colors
        success: {
          DEFAULT: '#10B981',
          light: '#34D399',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#F87171',
        },
        // Text colors
        text: {
          primary: '#111827', // near-black
          secondary: '#6B7280', // neutral gray
          muted: '#9CA3AF',
        },
      },
      borderRadius: {
        // Rounded corners: rounded-xl (default)
        DEFAULT: '0.75rem',
      },
      boxShadow: {
        // Very soft, low-contrast shadows
        'soft': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'soft-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      fontFamily: {
        // Inter or System UI
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config

