import { ArrowDown, ImageIcon } from 'lucide-react';

// "Photo → video" process timeline used inside the video showcase bands. Shows
// the source still on top and the generated clip below, connected by an arrow,
// to make the photo→video transformation legible at a glance.
// `mediaClassName` lets a caller match the clip's framing (e.g. the reforma
// clip's zoom that crops its baked-in pillarbox bars).
// `compactPhoto` shrinks the source still into a smaller card so the generated
// clip (the payoff) reads as the larger element of the two.
export function ProcessTimeline({ image, video, labels, mediaClassName = '', compactPhoto = false }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Panel
        label={labels.photo}
        step={1}
        icon={ImageIcon}
        className={compactPhoto ? 'w-[42%] max-w-[240px]' : 'w-full'}
      >
        <img
          src={image}
          alt=""
          loading="lazy"
          className={`h-full w-full object-cover ${mediaClassName}`}
        />
      </Panel>

      <ArrowDown className="h-6 w-6 text-lp-muted" aria-hidden />

      <Panel label={labels.video} step={2}>
        <video
          src={video}
          poster={image}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className={`h-full w-full object-cover ${mediaClassName}`}
        />
      </Panel>
    </div>
  );
}

function Panel({ label, step, icon: Icon, className = 'w-full', children }) {
  return (
    <figure className={`relative aspect-video overflow-hidden rounded-lp-xl bg-brand-teal shadow-popover ${className}`}>
      {children}
      <figcaption className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-[10px] font-bold text-brand-teal">
          {step}
        </span>
        {label}
        {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
      </figcaption>
    </figure>
  );
}
