import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Apple grammar: blue pill primary, ghost-pill secondary, compact utility rect.
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium press disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 rounded-pill',
        secondary:
          'bg-transparent text-primary border border-primary hover:bg-primary/5 rounded-pill',
        utility:
          'bg-ink text-white hover:bg-ink/90 rounded-sm',
        ghost: 'hover:bg-secondary text-foreground rounded-md',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-6 text-[15px]',
        sm: 'h-9 px-4 text-sm',
        lg: 'h-12 px-8 text-[17px]',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
