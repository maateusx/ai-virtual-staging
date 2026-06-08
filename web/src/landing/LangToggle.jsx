import { useLang, SUPPORTED_LANGS } from './i18n';
import { cn } from '@/lib/utils';

// Small pill segmented control to switch PT/EN.
export function LangToggle({ className }) {
  const { lang, setLang } = useLang();
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-pill border border-lp-hairline bg-canvas p-0.5',
        className
      )}
    >
      {SUPPORTED_LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={cn(
            'rounded-pill px-2.5 py-1 text-xs font-semibold uppercase transition-colors',
            lang === l ? 'bg-lp-ink text-white' : 'text-lp-muted hover:text-lp-ink'
          )}
          aria-pressed={lang === l}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
