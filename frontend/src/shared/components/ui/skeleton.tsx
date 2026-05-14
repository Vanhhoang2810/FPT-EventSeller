import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  /** Số dòng skeleton text */
  lines?: number;
  /** Chiều cao mặc định khi không có className */
  height?: string;
}

/** Skeleton block đơn */
export function Skeleton({ className, height = 'h-4' }: SkeletonProps) {
  return <div className={cn('skeleton rounded', height, className)} />;
}

/** Nhiều dòng skeleton text */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn('skeleton rounded h-4', i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}

/** Skeleton card */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-4 space-y-3', className)}>
      <div className="skeleton h-40 rounded-lg" />
      <div className="skeleton h-4 rounded w-4/5" />
      <div className="skeleton h-3 rounded w-3/5" />
    </div>
  );
}
