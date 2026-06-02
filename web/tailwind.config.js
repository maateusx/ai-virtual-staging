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
      },
      boxShadow: {
        // The single Apple product shadow — reserved for imagery.
        product: 'rgba(0, 0, 0, 0.22) 3px 5px 30px 0',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
      },
    },
  },
  plugins: [animate],
};
