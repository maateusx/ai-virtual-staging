import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Apple-inspired palette (see docs/design-system.md)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        parchment: '#f5f5f7',
        ink: '#1d1d1f',

        // Landing-style palette — scoped to the marketing landing page only
        // (see docs/design.md). Does not affect the app UI.
        canvas: '#fffaf0',
        'surface-soft': '#faf5e8',
        'surface-card': '#f5f0e0',
        'surface-strong': '#ebe6d6',
        'lp-ink': '#0a0a0a',
        'lp-body': '#3a3a3a',
        'lp-muted': '#6a6a6a',
        'lp-hairline': '#e5e5e5',
        'brand-pink': '#ff4d8b',
        'brand-teal': '#1a3a3a',
        'brand-lavender': '#b8a4ed',
        'brand-peach': '#ffb084',
        'brand-ochre': '#e8b94a',
        'brand-mint': '#a4d4c5',
        'brand-coral': '#ff6b5a',
      },
      fontFamily: {
        sans: [
          'SF Pro Text',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter',
          'sans-serif',
        ],
        display: [
          'SF Pro Display',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter',
          'sans-serif',
        ],
      },
      borderRadius: {
        sm: '8px',
        md: '11px',
        lg: '18px',
        pill: '9999px',
        // Landing radii (docs/design.md)
        'lp-md': '12px',
        'lp-lg': '16px',
        'lp-xl': '24px',
      },
      boxShadow: {
        // The single Apple product shadow — reserved for imagery.
        product: 'rgba(0, 0, 0, 0.22) 3px 5px 30px 0',
        // Soft elevation for floating UI (dropdown panels, popovers).
        popover: '0 8px 28px -6px rgba(0, 0, 0, 0.12), 0 2px 6px -2px rgba(0, 0, 0, 0.08)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-28px)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '25%': { transform: 'translate(20px, -22px) rotate(8deg)' },
          '50%': { transform: 'translate(2px, -38px) rotate(-4deg)' },
          '75%': { transform: 'translate(-20px, -18px) rotate(6deg)' },
        },
        sway: {
          '0%, 100%': { transform: 'translateY(0) rotate(-16deg)' },
          '50%': { transform: 'translateY(-22px) rotate(16deg)' },
        },
        bob: {
          '0%, 100%': { transform: 'translateY(0) rotate(-6deg)' },
          '50%': { transform: 'translateY(-20px) rotate(10deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        float: 'float 4.5s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        drift: 'drift 7s ease-in-out infinite',
        sway: 'sway 4s ease-in-out infinite',
        bob: 'bob 3s ease-in-out infinite',
      },
    },
  },
  plugins: [animate],
};
