import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useLang } from './i18n';
import { LangToggle } from './LangToggle';

const APP_LINKS = ['Abrir app', 'Open app'];

// Cream footer (docs/design.md `footer`) — NOT a dark footer, per the system
// contract: the page stays warm-light all the way down.
export function LandingFooter() {
  const { t } = useLang();
  return (
    <footer className="border-t border-lp-hairline/70 bg-surface-soft">
      <div className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <span className="flex items-center gap-1.5 text-[17px] font-semibold tracking-[-0.02em] text-lp-ink">
              <Sparkles className="h-5 w-5 text-brand-pink" />
              decorar<span className="text-brand-pink">.ai</span>
            </span>
            <p className="mt-3 max-w-xs text-sm text-lp-muted">{t.footer.tagline}</p>
            <LangToggle className="mt-5" />
          </div>

          {t.footer.columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-[1.5px] text-lp-muted">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    {APP_LINKS.includes(link) ? (
                      <Link to="/app" className="text-sm text-lp-body hover:text-lp-ink">
                        {link}
                      </Link>
                    ) : (
                      <a href="#top" className="text-sm text-lp-body hover:text-lp-ink">
                        {link}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-lp-hairline/70 pt-6">
          <p className="text-sm text-lp-muted">{t.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
}
