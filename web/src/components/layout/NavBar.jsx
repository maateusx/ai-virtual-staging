import { NavLink } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { to: '/', label: 'Staging', end: true },
  { to: '/config', label: 'Configuração' },
];

export function NavBar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md backdrop-saturate-150">
      <nav className="mx-auto flex h-12 max-w-6xl items-center gap-8 px-6">
        <NavLink to="/" className="flex items-center gap-1.5 font-display text-[15px] font-semibold">
          <Sparkles className="h-4 w-4 text-primary" />
          decorar<span className="text-primary">.ai</span>
        </NavLink>
        <div className="flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  'rounded-pill px-3 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
