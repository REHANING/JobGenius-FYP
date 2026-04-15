/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Bright SaaS Theme
        'saas-bg-primary': '#FFFFFF',
        'saas-bg-secondary': '#F8FAFC',
        'saas-cyan': '#22D3EE',
        'saas-purple': '#A855F7',
        'saas-text-heading': '#0F172A',
        'saas-text-body': '#475569',
        'saas-text-muted': 'rgba(71, 85, 105, 0.75)',
        'saas-border': 'rgba(15, 23, 42, 0.08)',
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'saas-card': '0 8px 24px rgba(15, 23, 42, 0.08)',
        'saas-card-hover': '0 14px 32px rgba(15, 23, 42, 0.12)',
        'saas-button': '0 6px 16px rgba(34, 211, 238, 0.35)',
      },
      borderRadius: {
        'saas': '16px',
        'saas-sm': '14px',
        'saas-md': '12px',
      },
    },
  },
  plugins: [],
};
