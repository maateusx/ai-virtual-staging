import { useCallback, useEffect, useRef, useState } from 'react';
import { Brush, Undo2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Paint a mask over the uploaded photo: the user brushes over the region to
// edit. Strokes are stored in normalized [0..1] image coordinates so they
// survive re-layout; the exported mask PNG is rendered at the image's natural
// resolution (black background, white strokes) and handed back via onChange.
export function MaskCanvas({ src, onChange, onClear, disabled }) {
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const strokesRef = useRef([]); // [{ size, points: [{x, y}] }] all normalized
  const drawingRef = useRef(null);

  const [brush, setBrush] = useState(0.07); // brush diameter as a fraction of width
  const [display, setDisplay] = useState({ w: 0, h: 0 });
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [hasMask, setHasMask] = useState(false);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const drawStroke = (ctx, stroke, w, h) => {
    const pts = stroke.points;
    if (!pts.length) return;
    ctx.lineWidth = Math.max(1, stroke.size * w);
    ctx.beginPath();
    ctx.moveTo(pts[0].x * w, pts[0].y * h);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x * w, pts[i].y * h);
    // A single tap still leaves a round dot.
    if (pts.length === 1) ctx.lineTo(pts[0].x * w + 0.01, pts[0].y * h);
    ctx.stroke();
  };

  // Repaint the visible (pink) overlay.
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !display.w) return;
    canvas.width = Math.round(display.w * dpr);
    canvas.height = Math.round(display.h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, display.w, display.h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.5)';
    for (const stroke of strokesRef.current) drawStroke(ctx, stroke, display.w, display.h);
  }, [display, dpr]);

  const syncSize = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    setDisplay({ w: img.clientWidth, h: img.clientHeight });
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
  }, []);

  useEffect(() => {
    window.addEventListener('resize', syncSize);
    return () => window.removeEventListener('resize', syncSize);
  }, [syncSize]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Render the mask at full resolution and hand the PNG back to the parent.
  const emit = useCallback(() => {
    const { w, h } = natural;
    if (!w || !h || strokesRef.current.length === 0) {
      onChange?.(null);
      return;
    }
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const ctx = off.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#fff';
    for (const stroke of strokesRef.current) drawStroke(ctx, stroke, w, h);
    off.toBlob((blob) => {
      if (blob) onChange?.(new File([blob], 'mask.png', { type: 'image/png' }));
    }, 'image/png');
  }, [natural, onChange]);

  const point = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return {
      x: Math.max(0, Math.min(1, (src.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (src.clientY - rect.top) / rect.height)),
    };
  };

  const start = (e) => {
    if (disabled) return;
    e.preventDefault();
    drawingRef.current = { size: brush, points: [point(e)] };
    strokesRef.current.push(drawingRef.current);
    redraw();
  };
  const move = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    drawingRef.current.points.push(point(e));
    redraw();
  };
  const end = () => {
    if (!drawingRef.current) return;
    drawingRef.current = null;
    setHasMask(strokesRef.current.length > 0);
    emit();
  };

  const undo = () => {
    strokesRef.current.pop();
    setHasMask(strokesRef.current.length > 0);
    redraw();
    emit();
  };
  const clearAll = () => {
    strokesRef.current = [];
    setHasMask(false);
    redraw();
    onChange?.(null);
  };

  return (
    <div className="space-y-3">
      <div className="relative mx-auto w-fit overflow-hidden rounded-lg border border-border bg-secondary">
        <img
          ref={imgRef}
          src={src}
          alt="ambiente"
          onLoad={syncSize}
          draggable={false}
          className="block max-h-[480px] max-w-full select-none"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none cursor-crosshair"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
        {!disabled && (
          <Button
            variant="utility"
            size="sm"
            onClick={onClear}
            className="absolute right-3 top-3"
          >
            <X className="h-4 w-4" /> Trocar
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Brush className="h-4 w-4" /> Pincel
          <input
            type="range"
            min={0.02}
            max={0.2}
            step={0.005}
            value={brush}
            onChange={(e) => setBrush(Number(e.target.value))}
            disabled={disabled}
            className="w-28 accent-primary"
          />
        </label>
        <Button variant="secondary" size="sm" onClick={undo} disabled={disabled || !hasMask}>
          <Undo2 className="h-4 w-4" /> Desfazer
        </Button>
        <Button variant="ghost" size="sm" onClick={clearAll} disabled={disabled || !hasMask}>
          Limpar
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Pinte sobre o que deseja alterar e descreva a mudança no campo{' '}
        <span className="font-medium">“O que mudar”</span> ao lado.
      </p>
    </div>
  );
}
