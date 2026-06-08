// Renders a result's metadata as a single muted line, joining the truthy
// fields with " · ". Each page builds its own list (model, time, cost, …);
// falsy entries are dropped so optional fields never leave dangling separators.
export function MetaLine({ items, className = '' }) {
  const parts = items.filter(Boolean);
  if (!parts.length) return null;
  return <span className={`text-sm text-muted-foreground ${className}`}>{parts.join(' · ')}</span>;
}
