// Shared page header for the tool screens. Keeps the title/subtitle rhythm
// identical across Staging, Video and Config (same size, spacing and measure).
export function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-10 max-w-2xl">
      <h1 className="font-display text-4xl font-semibold leading-tight">{title}</h1>
      {subtitle && <p className="mt-3 text-lg text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
