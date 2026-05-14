import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  variant: 'emerald' | 'violet' | 'amber' | 'cyan';
  sub?: string;
  trend?: number;
  sparkData?: number[]; // Dữ liệu 7 điểm cho mini sparkline
}

const V = {
  emerald: {
    css: 'adm-stat-emerald',
    iconBg: 'bg-emerald-500/20 ring-1 ring-emerald-500/30',
    iconText: 'text-emerald-300',
    value: 'text-emerald-200',
    spark: '#10b981',
    sparkFill: 'rgba(16,185,129,0.25)',
  },
  violet: {
    css: 'adm-stat-violet',
    iconBg: 'bg-violet-500/20 ring-1 ring-violet-500/30',
    iconText: 'text-violet-300',
    value: 'text-violet-200',
    spark: '#8b5cf6',
    sparkFill: 'rgba(139,92,246,0.25)',
  },
  amber: {
    css: 'adm-stat-amber',
    iconBg: 'bg-amber-500/20 ring-1 ring-amber-500/30',
    iconText: 'text-amber-300',
    value: 'text-amber-200',
    spark: '#f59e0b',
    sparkFill: 'rgba(245,158,11,0.25)',
  },
  cyan: {
    css: 'adm-stat-cyan',
    iconBg: 'bg-cyan-500/20 ring-1 ring-cyan-500/30',
    iconText: 'text-cyan-300',
    value: 'text-cyan-200',
    spark: '#06b6d4',
    sparkFill: 'rgba(6,182,212,0.25)',
  },
};

export function StatCard({ label, value, icon: Icon, variant, sub, trend, sparkData }: StatCardProps) {
  const c = V[variant];
  const trendUp = trend !== undefined && trend >= 0;
  const spark = sparkData?.map((v) => ({ v }));

  return (
    <div className={`${c.css} group`}>
      {/* Top row: icon + trend */}
      <div className="mb-3 flex items-start justify-between relative z-10">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.iconBg}`}>
          <Icon size={18} className={c.iconText} />
        </div>
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            trendUp ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/15 text-red-300'
          }`}>
            {trendUp ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      {/* Value + label */}
      <p className={`stat-value-enter text-2xl font-bold tracking-tight relative z-10 ${c.value}`} style={{ fontFamily: 'var(--font-heading)' }}>
        {value}
      </p>
      <p className="mt-1 text-xs text-white/45 relative z-10">{label}</p>
      {sub && <p className="mt-0.5 text-[10px] text-white/30 relative z-10">{sub}</p>}

      {/* Sparkline mini chart */}
      {spark && spark.length > 1 && (
        <div className="mt-3 relative z-10 -mx-1">
          <ResponsiveContainer width="100%" height={36}>
            <AreaChart data={spark} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`spark-${variant}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={c.spark} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={c.spark} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ display: 'none' }}
                cursor={false}
              />
              <Area type="monotone" dataKey="v"
                stroke={c.spark} strokeWidth={1.5}
                fill={`url(#spark-${variant})`}
                dot={false}
                isAnimationActive animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
