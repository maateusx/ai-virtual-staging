import { Loader2 } from 'lucide-react';

// In-canvas "working…" block shown while a (slow) generation is in flight.
// Shared by Staging and Video so both flows give the same visual feedback.
export function ProcessingPlaceholder({ title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-secondary/40 py-12 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="font-medium">{title}</p>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
