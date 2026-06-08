import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

// Generic card-style select used across the app in place of native/Radix
// <select>. Opens a listbox of cards, each with an optional icon, a label and an
// optional description. ModeSelect/MotionSelect/VideoModelSelect and every
// inline dropdown share this one implementation so all selects look identical.
//
// Props:
//   options   – [{ id, label, description?, Icon? }]  (id is matched with ===)
//   value     – currently selected option id
//   onChange  – (id) => void
//   disabled  – disables the trigger
//   placeholder – text shown when nothing is selected
export function CardSelect({ options, value, onChange, disabled, placeholder = 'Selecione…' }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close the panel on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const selected = options.find((o) => o.id === value) ?? null;
  const SelectedIcon = selected?.Icon;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-lg border bg-background p-3 text-left transition-colors hover:border-foreground/30 disabled:opacity-50"
      >
        {SelectedIcon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
            <SelectedIcon className="h-5 w-5" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          {selected ? (
            <>
              <span className="block text-sm font-medium">{selected.label}</span>
              {selected.description && (
                <span className="block truncate text-xs text-muted-foreground">
                  {selected.description}
                </span>
              )}
            </>
          ) : (
            <span className="block text-sm text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-20 mt-2 grid w-full gap-2 rounded-lg border bg-background p-2 shadow-popover"
        >
          {options.map((o) => {
            const Icon = o.Icon;
            const isSelected = o.id === value;
            return (
              <button
                key={o.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
                className={`flex items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent hover:bg-muted'
                }`}
              >
                {Icon && (
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    {o.label}
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                  </span>
                  {o.description && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {o.description}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
