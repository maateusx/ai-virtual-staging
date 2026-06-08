import { cn } from '@/lib/utils';

// Landing-style button (docs/design.md). Renders as any element via `as`
// (e.g. `as={Link}` for routing, `as="a"` for anchor links).
const variants = {
  primary: 'bg-lp-ink text-white hover:bg-lp-ink/90',
  secondary: 'bg-canvas text-lp-ink border border-lp-hairline hover:bg-surface-soft',
  onColor: 'bg-white text-lp-ink hover:bg-white/90',
};

const sizes = {
  default: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-[15px]',
};

export function LandingButton({
  as: Comp = 'button',
  variant = 'primary',
  size = 'default',
  className,
  ...props
}) {
  return (
    <Comp
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lp-md font-semibold',
        'transition-colors active:scale-[0.98] focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-lp-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
