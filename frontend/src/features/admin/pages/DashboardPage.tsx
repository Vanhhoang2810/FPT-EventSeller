import { useEffect, useState, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, Users, Ticket, RefreshCw, Activity, Zap, DollarSign, BarChart3 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { StatCard } from '../components/StatCard';
import {
  useGetDashboardQuery, useGetRevenueChartQuery, useGetSeatFillStatsQuery,
  useGetDemographicsQuery, useGetConversionFunnelQuery, useGetPeakHoursQuery,
} from '../services/adminApi';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import { useSocket } from '../../../shared/hooks/useSocket';

interface ActivityItem { type: string; description: string; timestamp: string; _id?: string; }

// Adaptive palette — đọc từ CSS custom properties (dark/light aware)
// Recharts dùng string màu → cần resolve khi render
const getChartPalette = (dark: boolean) => ({
  c1: dark ? '#34d399' : '#059669',
  c2: dark ? '#a78bfa' : '#7c3aed',
  c3: dark ? '#22d3ee' : '#0891b2',
  c4: dark ? '#fbbf24' : '#d97706',
  c5: dark ? '#fb7185' : '#e11d48',
  c6: dark ? '#60a5fa' : '#2563eb',
  c7: dark ? '#fb923c' : '#ea580c',
  c8: dark ? '#94a3b8' : '#475569',
});

// Backwards-compat aliases (sẽ được compute trong component)
const PALETTE = {
  emerald: '#34d399', emeraldLight: '#34d399',
  violet:  '#a78bfa', violetLight:  '#a78bfa',
  amber:   '#fbbf24', amberLight:   '#fbbf24',
  cyan:    '#22d3ee', cyanLight:    '#22d3ee',
  rose:    '#fb7185', roseLight:    '#fb7185',
  blue:    '#60a5fa', blueLight:    '#60a5fa',
};

// GENDER_COLORS/AGE_COLORS/FUNNEL_COLORS đã chuyển vào component — dùng getChartPalette(dark)

// Màu cho Recharts SVG — không dùng CSS var được nên cần hook theme
// Dùng document.documentElement.classList.has('light') để detect
const isDark = () => !document.documentElement.classList.contains('light');

const C = {
  get surface() { return isDark() ? '#13131a' : '#ffffff'; },
  get border()  { return isDark() ? 'rgba(255,255,255,0.07)' : 'rgba(16,185,129,0.12)'; },
  get fg()      { return isDark() ? '#f1f5f9' : '#0f172a'; },
  get muted()   { return isDark() ? '#64748b' : '#94a3b8'; },
  get grid()    { return isDark() ? 'rgba(255,255,255,0.04)' : 'rgba(16,185,129,0.06)'; },
};

const CustomDot = ({ cx, cy, value }: { cx?: number; cy?: number; value?: number }) =>
  value && value > 0
    ? <circle cx={cx} cy={cy} r={4} fill={PALETTE.emerald} stroke="rgba(16,185,129,0.5)" strokeWidth={4} />
    : null;

export function DashboardPage() {
  const { t } = useTranslation('admin');
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme !== 'light';
  const [period, setPeriod] = useState<'hour' | 'day' | 'month' | 'year'>('day');

  const { data, isLoading, refetch: refetchStats }           = useGetDashboardQuery(undefined, { refetchOnMountOrArgChange: false });
  const [chartsEnabled, setChartsEnabled] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setChartsEnabled(true)); return () => cancelAnimationFrame(id); }, []);

  const { data: revenueData,      isFetching: revLoading,   refetch: refetchRevenue }   = useGetRevenueChartQuery({ period }, { skip: !chartsEnabled });
  const { data: seatFillData,     isFetching: seatLoading,  refetch: refetchSeatFill }  = useGetSeatFillStatsQuery(undefined,  { skip: !chartsEnabled });
  const { data: demographicsData, isFetching: demoLoading,  refetch: refetchDemo }      = useGetDemographicsQuery(undefined,   { skip: !chartsEnabled });
  const { data: funnelData,       isFetching: funnelLoading,refetch: refetchFunnel }    = useGetConversionFunnelQuery(undefined, { skip: !chartsEnabled });
  const { data: peakHoursData,    isFetching: peakLoading,  refetch: refetchPeak }      = useGetPeakHoursQuery(undefined,      { skip: !chartsEnabled });

  const isRefreshing = revLoading || seatLoading || demoLoading || funnelLoading || peakLoading;

  const handleRefreshAll = () => {
    refetchStats();
    if (chartsEnabled) {
      refetchRevenue(); refetchSeatFill(); refetchDemo(); refetchFunnel(); refetchPeak();
    }
  };

  const stats = data?.data;
  const revenueChart = (revenueData?.data ?? []).map((d) => {
    const raw = String((d as Record<string, unknown>).label ?? (d as Record<string, unknown>).date ?? '');
    let displayLabel = raw;
    if (period === 'day')   displayLabel = raw.slice(5);
    else if (period === 'hour')  displayLabel = raw.slice(11, 16);
    else if (period === 'month') displayLabel = raw.slice(0, 7);
    return { ...d, displayLabel, revenueM: Number(d.revenue) / 1_000_000 };
  });

  const seatFill    = seatFillData?.data ?? [];
  const genderData: { name: string; value: number }[]   = demographicsData?.data?.gender   ?? [];
  const ageGroupData: { name: string; value: number }[] = demographicsData?.data?.ageGroups ?? [];
  const funnel      = funnelData?.data ?? [];
  const peakHours   = (peakHoursData?.data ?? []).map((d) => ({ ...d, label: `${d.hour}h` }));
  const peakMax     = Math.max(...peakHours.map((d) => d.count), 1);
  const genderTotal = genderData.reduce((s, x) => s + x.value, 0);

  // Sparkline: lấy 10 điểm cuối của revenue chart (period=day)
  const revSpark = revenueChart.slice(-10).map((d) => Number(d.revenue));
  // Fake bookings spark — dùng đường cong nhẹ dựa trên revenue trend
  const bookSpark = revSpark.map((v, i) => Math.max(0, Math.round(v / 500000 + i * 0.3 + Math.sin(i) * 2)));

  // Adaptive chart colors — resolve theo theme hiện tại
  const P          = getChartPalette(dark);
  const chartMuted = dark ? '#64748b' : '#94a3b8';
  const chartGrid  = dark ? 'rgba(255,255,255,0.04)' : 'rgba(16,185,129,0.06)';
  const chartFg    = dark ? '#f1f5f9' : '#0f172a';

  // Adaptive pie/bar colors
  const genderColors = [P.c2, P.c5, P.c3];
  const ageColors    = [P.c1, P.c3, P.c6, P.c2, P.c4, P.c8];
  const funnelColors = [P.c1, P.c3, P.c2, P.c4];
  const tooltipComputed = {
    contentStyle: {
      background: dark ? 'rgba(13,13,18,0.96)' : 'rgba(255,255,255,0.97)',
      border: `1px solid rgba(16,185,129,${dark ? '0.25' : '0.30'})`,
      borderRadius: '14px', padding: '10px 14px',
      boxShadow: dark
        ? '0 20px 60px rgba(0,0,0,0.7)'
        : '0 8px 32px rgba(16,185,129,0.12)',
      fontSize: 12, color: chartFg, backdropFilter: 'blur(20px)',
    },
    itemStyle: { color: dark ? '#a1a1aa' : '#64748b' },
    labelStyle: { color: '#10b981', marginBottom: 4, fontWeight: 700 as const },
    cursor: { fill: 'rgba(16,185,129,0.04)' },
  };

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const actRef = useRef(0);
  const socketRef = useSocket();

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const join = () => socket.emit('join:admin');
    if (socket.connected) join(); else socket.once('connect', join);
    const handleActivity = (data: ActivityItem) =>
      setActivities((prev) => [{ ...data, _id: `${Date.now()}-${++actRef.current}` } as ActivityItem, ...prev].slice(0, 20));
    socket.on('admin:activity', handleActivity);
    return () => { socket.emit('leave:admin'); socket.off('admin:activity', handleActivity); };
  }, [socketRef]);

  return (
    <div className="admin-bg space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            {t('dashboard.title')}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.subtitle')}</p>
        </div>
        <button onClick={handleRefreshAll} disabled={isRefreshing}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-60 transition-all">
          <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
          {t('dashboard.refresh')}
        </button>
      </div>

      {/* ── Stat Cards ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 rounded-2xl skeleton" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label={t('dashboard.todayRevenue')} variant="emerald" value={formatCurrency(stats?.todayRevenue ?? 0)} icon={DollarSign} sparkData={revSpark} />
          <StatCard label={t('dashboard.totalRevenue')} variant="violet"  value={formatCurrency(stats?.totalRevenue ?? 0)} icon={TrendingUp} sparkData={revSpark} />
          <StatCard label={t('dashboard.users')}        variant="cyan"    value={(stats?.totalUsers ?? 0).toLocaleString('vi-VN')} icon={Users} />
          <StatCard label={t('dashboard.bookings')}     variant="amber"   value={(stats?.totalBookings ?? 0).toLocaleString('vi-VN')} icon={Ticket} sparkData={bookSpark} />
        </div>
      )}

      {/* ── Revenue Chart ── */}
      <div className="admin-chart-card glass-border-brand">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BarChart3 size={14} className="text-muted-foreground/60" />
              {t('dashboard.revenue.title')}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t(`dashboard.revenue.periodDesc.${period}`)} · {t('dashboard.revenue.unit')}</p>
          </div>
          <div className="flex gap-0.5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1 flex-shrink-0">
            {(['hour', 'day', 'month', 'year'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                  period === p
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}>
                {t(`dashboard.revenue.period.${p}`)}
              </button>
            ))}
          </div>
        </div>
        <div className={`transition-opacity duration-300 ${revLoading ? 'opacity-30' : 'opacity-100'}`}>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueChart} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={PALETTE.emerald} stopOpacity={0.45} />
                  <stop offset="50%"  stopColor={PALETTE.emerald} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={PALETTE.emerald} stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="revStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor={PALETTE.emerald}     />
                  <stop offset="60%"  stopColor={PALETTE.cyanLight}   />
                  <stop offset="100%" stopColor={PALETTE.amber}       />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
              <XAxis dataKey="displayLabel" tick={{ fontSize: 10, fill: chartMuted }} axisLine={false} tickLine={false}
                interval={period === 'hour' ? 3 : period === 'day' ? 4 : 0} />
              <YAxis tick={{ fontSize: 10, fill: chartMuted }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v % 1 === 0 ? v : v.toFixed(1)}M`} />
              <Tooltip {...tooltipComputed}
                formatter={(v) => [`${(v as number).toFixed(2)}M ₫`, t('dashboard.revenue.tooltipName')]}
                labelFormatter={(l) => t(`dashboard.revenue.tooltipLabel.${period}`, { val: l })} />
              <Area type="monotone" dataKey="revenueM"
                stroke="url(#revStroke)" strokeWidth={2.5}
                fill="url(#revFill)"
                dot={<CustomDot />}
                activeDot={{ r: 6, fill: PALETTE.emerald, stroke: 'rgba(16,185,129,0.5)', strokeWidth: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 2: Seat Fill + Demographics ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Seat Fill — vibrant gradient bars */}
        <div className="admin-chart-card glass-border-brand">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t('dashboard.seatFill.title')}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.seatFill.subtitle')}</p>
            </div>
          </div>
          <div className="space-y-4">
            {seatFill.slice(0, 6).map((item: { title: string; fillRate: number; sold: number; total: number }, i: number) => {
              const grad = i % 3 === 0
                ? `linear-gradient(90deg, ${PALETTE.emerald}, ${PALETTE.cyan})`
                : i % 3 === 1
                  ? `linear-gradient(90deg, ${PALETTE.violet}, ${PALETTE.blue})`
                  : `linear-gradient(90deg, ${PALETTE.amber}, ${PALETTE.rose})`;
              const shadow = i % 3 === 0
                ? 'rgba(16,185,129,0.5)' : i % 3 === 1
                  ? 'rgba(139,92,246,0.5)' : 'rgba(245,158,11,0.5)';
              return (
                <div key={item.title}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-foreground/60 flex-1 truncate mr-3" title={item.title}>{item.title}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-muted-foreground/60">{item.sold}/{item.total}</span>
                      <span className="text-xs font-bold text-foreground tabular-nums w-10 text-right">{item.fillRate}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${item.fillRate}%`, background: grad, boxShadow: `0 0 8px ${shadow}` }} />
                  </div>
                </div>
              );
            })}
            {seatFill.length === 0 && <p className="text-xs text-muted-foreground/60 text-center py-8">{t('dashboard.seatFill.noData')}</p>}
          </div>
        </div>

        {/* Demographics — vibrant donut + age bars */}
        <div className="admin-chart-card glass-border-brand">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">{t('dashboard.demographics.title')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.demographics.subtitle')}</p>
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
            {t('dashboard.demographics.genderLabel')}
          </p>
          <div className="flex items-center gap-4 mb-5">
            <div className="flex-shrink-0 relative">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={genderData.length ? genderData : [{ name: 'empty', value: 1 }]}
                    dataKey="value" cx="50%" cy="50%"
                    innerRadius={34} outerRadius={52}
                    paddingAngle={genderData.length > 1 ? 4 : 0} strokeWidth={0}
                  >
                    {(genderData.length ? genderData : [{ name: 'empty', value: 1 }]).map((_: unknown, i: number) => (
                      <Cell key={i} fill={genderData.length ? genderColors[i % genderColors.length] : '#27272a'} />
                    ))}
                  </Pie>
                  {genderData.length > 0 && (
                    <Tooltip {...tooltipComputed}
                      formatter={(v) => [Number(v).toLocaleString('vi-VN'), t('dashboard.demographics.tooltipCount')]}
                      labelFormatter={(l) => t(`dashboard.demographics.genderNames.${l}`, { defaultValue: l })} />
                  )}
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-bold text-foreground">{genderTotal.toLocaleString('vi-VN')}</span>
                <span className="text-[9px] text-muted-foreground/60">total</span>
              </div>
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              {genderData.map((d, i) => {
                const pct = genderTotal > 0 ? Math.round((d.value / genderTotal) * 100) : 0;
                return (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ background: genderColors[i % genderColors.length], boxShadow: `0 0 6px ${genderColors[i % genderColors.length]}` }} />
                    <span className="text-xs text-muted-foreground truncate flex-1">
                      {t(`dashboard.demographics.genderNames.${d.name}`, { defaultValue: d.name })}
                    </span>
                    <span className="text-xs font-semibold text-foreground tabular-nums">{pct}%</span>
                  </div>
                );
              })}
              {genderData.length === 0 && <p className="text-xs text-muted-foreground/60">{t('dashboard.demographics.noData')}</p>}
            </div>
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2.5">
            {t('dashboard.demographics.ageLabel')}
          </p>
          <div className="space-y-2">
            {(() => {
              const total = ageGroupData.reduce((s, x) => s + x.value, 0);
              return ageGroupData.map((d, i) => {
                const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                return (
                  <div key={d.name} className="flex items-center gap-2.5">
                    <span className="text-[10px] text-muted-foreground w-14 flex-shrink-0">
                      {t(`dashboard.demographics.ageNames.${d.name}`, { defaultValue: d.name })}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: ageColors[i % ageColors.length],
                          boxShadow: `0 0 6px ${ageColors[i % ageColors.length]}88`,
                        }} />
                    </div>
                    <span className="text-[10px] font-semibold text-foreground w-8 text-right tabular-nums">{pct}%</span>
                  </div>
                );
              });
            })()}
            {ageGroupData.length === 0 && <p className="text-xs text-muted-foreground/60">{t('dashboard.demographics.noData')}</p>}
          </div>
        </div>
      </div>

      {/* ── Row 3: Peak Hours + Funnel ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Peak Hours — colorful gradient bars */}
        <div className="admin-chart-card glass-border-brand">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap size={14} className="text-amber-400" /> {t('dashboard.peakHours.title')}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.peakHours.subtitle')}</p>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={peakHours} margin={{ top: 0, right: 0, left: -24, bottom: 0 }} barCategoryGap="28%">
              <defs>
                <linearGradient id="pkHot"  x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={P.c5} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={P.c4} stopOpacity={0.35} />
                </linearGradient>
                <linearGradient id="pkWarm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={P.c4} stopOpacity={0.90} />
                  <stop offset="100%" stopColor={P.c1} stopOpacity={0.30} />
                </linearGradient>
                <linearGradient id="pkMid"  x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={P.c1} stopOpacity={0.85} />
                  <stop offset="100%" stopColor={P.c3} stopOpacity={0.30} />
                </linearGradient>
                <linearGradient id="pkCold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={P.c3} stopOpacity={0.75} />
                  <stop offset="100%" stopColor={P.c6} stopOpacity={0.25} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} horizontal vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: chartMuted }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 9, fill: chartMuted }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipComputed}
                formatter={(v) => [v as number, t('dashboard.peakHours.tooltipName')]}
                labelFormatter={(l) => `${l}:00`}
                cursor={{ fill: 'rgba(16,185,129,0.04)', radius: 6 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={18}
                isAnimationActive animationDuration={800} animationEasing="ease-out">
                {peakHours.map((d: { count: number }, i: number) => {
                  const ratio = peakMax > 0 ? d.count / peakMax : 0;
                  const gradId = ratio > 0.7 ? 'pkHot' : ratio > 0.45 ? 'pkWarm' : ratio > 0.2 ? 'pkMid' : 'pkCold';
                  return <Cell key={i} fill={`url(#${gradId})`} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Funnel — colorful with drop-off */}
        <div className="admin-chart-card glass-border-brand">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-foreground">{t('dashboard.funnel.title')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.funnel.subtitle')}</p>
          </div>
          <div className="space-y-3">
            {funnel.map((item: { stage: string; value: number }, i: number) => {
              const max  = funnel[0]?.value || 1;
              const pct  = Math.min(100, Math.round((item.value / max) * 100));
              const prev = i > 0 ? funnel[i - 1]?.value : null;
              const drop = prev ? Math.round(((prev - item.value) / prev) * 100) : null;
              const color = funnelColors[i];
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-20 text-right flex-shrink-0">
                    <span className="text-xs text-muted-foreground leading-tight">
                      {(t(`dashboard.funnel.stages.${i}`) as string) || item.stage}
                    </span>
                  </div>
                  <div className="flex-1 h-7 rounded-lg bg-white/[0.04] overflow-hidden relative border border-white/[0.04]">
                    <div className="h-full rounded-lg flex items-center transition-all duration-700"
                      style={{
                        width: `${Math.max(pct, 8)}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}99)`,
                        boxShadow: `0 0 16px ${color}55`,
                      }}>
                      <span className="px-2.5 text-[10px] font-bold text-white whitespace-nowrap">
                        {i === 3 ? formatCurrency(item.value) : item.value.toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  <div className="w-14 text-right flex-shrink-0">
                    {drop !== null && drop > 0
                      ? <span className="text-[10px] text-rose-400/80">↓{drop}%</span>
                      : <span className="text-xs font-semibold text-foreground tabular-nums">{pct}%</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Live Activity Feed ── */}
      <div className="admin-chart-card glass-border-brand">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-foreground">{t('dashboard.liveActivity.title')}</h2>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-white/50 animate-pulse" />
            {t('dashboard.liveActivity.live')}
          </div>
        </div>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
              <Activity size={20} className="text-white/25" />
            </div>
            <p className="text-sm text-muted-foreground/60">{t('dashboard.liveActivity.waiting')}</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {activities.map((a, i) => (
              <div key={a._id ?? i} className="stagger-item flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.03] transition-colors group">
                <div className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.8)] group-hover:shadow-[0_0_10px_rgba(16,185,129,1)]" />
                <span className="text-sm text-foreground/80 flex-1 leading-snug">{a.description}</span>
                <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap tabular-nums">
                  {new Date(a.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
