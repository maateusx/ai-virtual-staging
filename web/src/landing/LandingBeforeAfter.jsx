import { useRef, useState } from 'react';

// Landing-themed draggable before/after slider for the landing hero.
// Adapted from web/src/components/BeforeAfter.jsx with Landing tokens and
// i18n-able labels. The "after" image defines the box; "before" is revealed
// from the left via clip-path so it never reflows as the handle moves.
export function LandingBeforeAfter({
  before,
  after,
  beforeLabel,
  afterLabel,
  imgClassName = 'block max-h-[520px] w-full object-cover',
}) {
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
      className="relative select-none overflow-hidden rounded-lp-lg bg-surface-strong"
      onMouseMove={(e) => dragging.current && move(e.clientX)}
      onMouseUp={() => (dragging.current = false)}
      onMouseLeave={() => (dragging.current = false)}
      onTouchMove={(e) => move(e.touches[0].clientX)}
    >
      <img src={after} alt={afterLabel} className={imgClassName} />

      <img
        src={before}
        alt={beforeLabel}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />

      <span className="absolute left-3 top-3 rounded-pill bg-lp-ink/70 px-2.5 py-1 text-xs font-medium text-white">
        {beforeLabel}
      </span>
      <span className="absolute right-3 top-3 rounded-pill bg-brand-pink px-2.5 py-1 text-xs font-medium text-white">
        {afterLabel}
      </span>

      <div
        className="absolute inset-y-0 z-10 w-0.5 cursor-ew-resize bg-white"
        style={{ left: `${pos}%` }}
        onMouseDown={() => (dragging.current = true)}
        onTouchStart={() => (dragging.current = true)}
      >
        <div className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-lp-ink shadow-md">
          ⇆
        </div>
      </div>
    </div>
  );
}
