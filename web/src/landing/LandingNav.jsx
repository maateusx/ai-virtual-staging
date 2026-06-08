import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Menu, X } from 'lucide-react';
import { useLang } from './i18n';
import { LandingButton } from './LandingButton';
import { LangToggle } from './LangToggle';

// Cream top-nav (docs/design.md `top-nav`). Collapses to a hamburger < 768px.
export function LandingNav() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '#features', label: t.nav.features },
    { href: '#how', label: t.nav.how },
    { href: '#pricing', label: t.nav.pricing },
  ];

  return (
    <header className="sticky top-3 z-50 w-full px-4">
      <nav
        className={`mx-auto flex h-16 max-w-[1100px] items-center justify-between rounded-full px-6 transition-all duration-300 ${
          scrolled
            ? 'border border-white/40 bg-white/55 shadow-[0_8px_32px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,0.6)] ring-1 ring-black/[0.04] backdrop-blur-xl backdrop-saturate-150'
            : 'border border-transparent bg-transparent'
        }`}
      >
        <a href="#top" className="flex items-center gap-1.5 text-[17px] font-semibold tracking-[-0.02em] text-lp-ink">
          <Sparkles className="h-5 w-5 text-brand-pink" />
          decorar<span className="text-brand-pink">.ai</span>
        </a>

        {/* Desktop menu */}
        <div className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-lp-muted transition-colors hover:text-lp-ink"
            >
              {l.label}
            </a>
          ))}
          <LangToggle />
          <Link to="/app" className="text-sm font-medium text-lp-ink hover:opacity-70">
            {t.nav.signin}
          </Link>
          <LandingButton as={Link} to="/app">
            {t.nav.cta}
          </LandingButton>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lp-md text-lp-ink md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="mx-4 mt-2 rounded-3xl border border-white/40 bg-white/70 px-6 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,0.6)] ring-1 ring-black/[0.04] backdrop-blur-xl backdrop-saturate-150 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-lp-body"
              >
                {l.label}
              </a>
            ))}
            <div className="flex items-center justify-between">
              <LangToggle />
              <Link to="/app" className="text-sm font-medium text-lp-ink">
                {t.nav.signin}
              </Link>
            </div>
            <LandingButton as={Link} to="/app" className="w-full">
              {t.nav.cta}
            </LandingButton>
          </div>
        </div>
      )}
    </header>
  );
}
