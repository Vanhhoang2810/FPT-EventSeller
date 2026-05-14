import { cn } from '../../../shared/utils/cn';

interface MarqueeProps {
  items: string[];
  speed?: number;
  reverse?: boolean;
  separator?: string;
  className?: string;
}

/**
 * Infinite scrolling marquee — award-winning design staple.
 * Pure CSS animation, zero JS overhead.
 */
export function Marquee({ items, speed = 40, reverse = false, separator = '·', className }: MarqueeProps) {
  const content = items.map((item, i) => (
    <span key={i} className="flex items-center gap-4 px-2">
      <span className="text-muted-foreground/40 text-sm">{separator}</span>
      <span>{item}</span>
    </span>
  ));

  return (
    <div className={cn('flex overflow-hidden', className)}>
      <div
        className={cn(
          'flex shrink-0 gap-0',
          reverse ? 'animate-marquee-reverse' : 'animate-marquee',
        )}
        style={{ '--marquee-speed': `${speed}s` } as React.CSSProperties}
        aria-hidden="true"
      >
        {content}{content}
      </div>
      <div
        className={cn(
          'flex shrink-0 gap-0',
          reverse ? 'animate-marquee-reverse' : 'animate-marquee',
        )}
        style={{ '--marquee-speed': `${speed}s` } as React.CSSProperties}
        aria-hidden="true"
      >
        {content}{content}
      </div>
    </div>
  );
}
