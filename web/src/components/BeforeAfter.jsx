import { useRef, useState } from 'react';

// Draggable before/after comparison slider.
// The "before" layer always fills the full container and is revealed via
// clip-path, so it never resizes as the handle moves — only the visible
// portion changes.
export function BeforeAfter({ before, after }) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef(null);
  const dragging = useRef(false);

  const move = (clientX) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  };

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden rounded-lg border border-border bg-secondary"
      onMouseMove={(e) => dragging.current && move(e.clientX)}
      onMouseUp={() => (dragging.current = false)}
      onMouseLeave={() => (dragging.current = false)}
      onTouchMove={(e) => move(e.touches[0].clientX)}
    >
      {/* After defines the box size */}
      <img src={after} alt="depois" className="block max-h-[480px] w-full object-contain" />

      {/* Before: same full size, revealed from the left up to `pos` */}
      <img
        src={before}
        alt="antes"
        className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />

      <span className="absolute left-2 top-2 rounded-pill bg-ink/70 px-2 py-0.5 text-xs text-white">
        Antes
      </span>
      <span className="absolute right-2 top-2 rounded-pill bg-primary px-2 py-0.5 text-xs text-white">
        Depois
      </span>

      {/* Drag handle */}
      <div
        className="absolute inset-y-0 z-10 w-0.5 cursor-ew-resize bg-white shadow"
        style={{ left: `${pos}%` }}
        onMouseDown={() => (dragging.current = true)}
        onTouchStart={() => (dragging.current = true)}
      >
        <div className="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-md">
          ⇆
        </div>
      </div>
    </div>
  );
}
