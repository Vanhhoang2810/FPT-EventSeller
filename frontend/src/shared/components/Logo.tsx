import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { cn } from '../utils/cn';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
  className?: string;
  onClick?: () => void;
  asLink?: boolean;
}

const SIZES = {
  sm: { icon: 26, text: 'text-base' },
  md: { icon: 32, text: 'text-xl' },
  lg: { icon: 44, text: 'text-2xl' },
};

/**
 * Logo mark — Ticket Rush 2025
 *
 * Concept: Hình VÉ (ticket) + LIGHTNING BOLT (rush)
 * - Ticket shape: horizontal rect với notch 2 bên và đường perforation
 * - Lightning bolt xuyên qua ticket, phá vỡ viền trên/dưới → "rush"
 * - No hardcoded background → works on dark + light
 * - Notch dùng currentColor → tự blend với bất kỳ nền nào
 *
 * Colors:
 *   Ticket outline: #10B981 (emerald-500)
 *   Bolt gradient:  #059669 → #F97316 (emerald-600 → orange-500)
 */
function LogoMark({ size = 32 }: { size?: number }) {
  const id = `tr${size}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <defs>
        {/* Bolt: emerald → orange, từ trên xuống */}
        <linearGradient id={`${id}-b`} x1="0.6" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
        {/* Subtle drop shadow cho bolt — depth mà không cần bg */}
        <filter id={`${id}-f`} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.5"
            floodColor="#F97316" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* ── TICKET SHAPE ── */}

      {/* Stub (trái) — fill nhạt gợi ý section riêng */}
      <rect x="5" y="15" width="11" height="18"
        rx="3" fill="#10B981" fillOpacity="0.12" />

      {/* Full ticket border */}
      <rect x="5" y="15" width="38" height="18"
        rx="3" fill="none" stroke="#10B981" strokeWidth="1.8" />

      {/* Perforation (đường cắt giữa stub và main) */}
      <line x1="16" y1="15" x2="16" y2="33"
        stroke="#10B981" strokeWidth="1.2"
        strokeDasharray="2,2.5" strokeLinecap="round"
        opacity="0.55" />

      {/* Notch trái — currentColor = tự blend với bg */}
      <circle cx="5" cy="24" r="5" fill="currentColor" />
      {/* Notch phải */}
      <circle cx="43" cy="24" r="5" fill="currentColor" />

      {/* ── LIGHTNING BOLT ── */}
      {/*
        Bolt xuyên qua ticket (y từ 11→37, ticket từ 15→33)
        → 2 đầu bolt "phá" viền ticket → cảm giác "rush" năng động
        Path: top-right → mid-left (qua notch) → bottom-left → back
      */}
      <path
        d="M 34,11 L 23,26 L 28.5,26 L 18,37 L 30,22 L 24.5,22 Z"
        fill={`url(#${id}-b)`}
        filter={`url(#${id}-f)`}
      />
    </svg>
  );
}

function LogoText({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const { text } = SIZES[size];
  return (
    <span className={cn('font-bold leading-none tracking-tight whitespace-nowrap', text)}>
      <span className="text-primary-500">Ticket</span>
      <span className="text-accent-500"> Rush</span>
    </span>
  );
}

export function Logo({ size = 'md', iconOnly = false, className, onClick, asLink = true }: LogoProps) {
  const { icon } = SIZES[size];

  const inner = (
    <>
      <LogoMark size={icon} />
      {!iconOnly && <LogoText size={size} />}
    </>
  );

  if (!asLink) {
    return (
      <span className={cn('flex items-center gap-2', className)} onClick={onClick}>
        {inner}
      </span>
    );
  }

  return (
    <Link to={ROUTES.HOME} className={cn('flex items-center gap-2', className)} onClick={onClick}>
      {inner}
    </Link>
  );
}
