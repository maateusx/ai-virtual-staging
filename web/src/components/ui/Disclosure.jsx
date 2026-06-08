import { ChevronDown } from 'lucide-react';

// A muted chevron + label toggle used to reveal an extra panel (final prompt,
// composed prompt, etc). The chevron rotates when open. Shared so every
// disclosure in the app looks and behaves identically.
export function DisclosureToggle({ open, onToggle, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground ${className}`}
    >
      <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      {children}
    </button>
  );
}
