/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core Military / Institutional Palette
        emerald: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B', // Primary Emerald Ink
          950: '#022C22', // Command Ink
        },
        champagne: {
          50: '#FFFDF9',
          100: '#FEFBF5', // Canvas Surface
          200: '#FDF6E9',
          300: '#F8E7C9', // Champagne Accent
          400: '#EAD4AE',
          500: '#D5BC8A',
          600: '#B5985E',
          700: '#8A703E',
          800: '#5E4B28',
          900: '#3D3019',
        },
        institutional: {
          canvas: '#F8FAFC',
          card: '#FFFFFF',
          pearl: '#F8FAFC',
          border: '#E2E8F0',
          borderStrong: '#CBD5E1',
          ink: '#09090B',
          champagne: '#F1F5F9',
          gold: '#334155',
          dark: '#09090B',
          muted: '#64748B',
          subtle: '#94A3B8',
        },
        risk: {
          resilient: {
            bg: '#ECFDF5',
            text: '#065F46',
            border: '#A7F3D0',
            dot: '#10B981',
          },
          fatigued: {
            bg: '#FFFBEB',
            text: '#92400E',
            border: '#FDE68A',
            dot: '#F59E0B',
          },
          vulnerable: {
            bg: '#FFF7ED',
            text: '#9A3412',
            border: '#FED7AA',
            dot: '#EA580C',
          },
          critical: {
            bg: '#FEF2F2',
            text: '#991B1B',
            border: '#FECACA',
            dot: '#DC2626',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'gov-subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'gov-card': '0 1px 3px 0 rgba(6, 78, 59, 0.06), 0 1px 2px -1px rgba(6, 78, 59, 0.04)',
        'gov-elevated': '0 4px 6px -1px rgba(6, 78, 59, 0.08), 0 2px 4px -2px rgba(6, 78, 59, 0.04)',
        'gov-modal': '0 20px 25px -5px rgba(6, 78, 59, 0.12), 0 8px 10px -6px rgba(6, 78, 59, 0.08)',
        'champagne-glow': '0 0 0 2px #F8E7C9, 0 4px 12px rgba(248, 231, 201, 0.5)',
      },
    },
  },
  plugins: [],
}
