import { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStagingStore } from '@/store/stagingStore';
import { useLang } from './i18n';

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];

// Interactive demo: dropping (or picking) a photo loads it into the staging
// store — a module singleton, so it survives the route change — and navigates
// to /app, where the editor opens with the photo already in place.
export function TryDemo() {
  const { t } = useLang();
  const navigate = useNavigate();
  const setImage = useStagingStore((s) => s.setImage);
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (files) => {
      const file = files?.[0];
      if (file && ACCEPT.includes(file.type)) {
        setImage(file);
        navigate('/app');
      }
    },
    [setImage, navigate]
  );

  return (
    <section id="demo" className="mx-auto max-w-[1280px] px-6 py-20 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-[1.5px] text-lp-muted">
          {t.demo.label}
        </span>
        <h2 className="mt-3 text-[32px] font-medium leading-tight tracking-[-0.02em] text-lp-ink sm:text-[40px]">
          {t.demo.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[17px] text-lp-body">{t.demo.subtitle}</p>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'mx-auto mt-12 flex min-h-[260px] max-w-3xl cursor-pointer flex-col items-center justify-center gap-4 rounded-lp-xl border-2 border-dashed border-lp-hairline bg-surface-card/50 text-center transition-colors',
          dragging && 'border-brand-pink bg-brand-pink/5'
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-canvas shadow-popover">
          <Upload className="h-6 w-6 text-brand-pink" />
        </div>
        <div>
          <p className="text-lg font-semibold text-lp-ink">{t.demo.dropTitle}</p>
          <p className="mt-1 text-sm text-lp-muted">{t.demo.dropHint}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(',')}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </section>
  );
}
