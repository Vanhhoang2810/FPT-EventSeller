import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Download, FileText, TrendingUp, BarChart3, Loader2,
  Users, PieChart, Activity, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  AreaChart, Area, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { useGetRevenueChartQuery, useGetDemographicsQuery, useGetConversionFunnelQuery } from '../services/adminApi';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import type { RootState } from '../../../app/store';

// Màu adaptive: dark = sáng hơn để nhìn rõ, light = tối hơn để đủ contrast
const getAdaptiveColors = (dark: boolean) => ({
  gender:  dark
    ? ['#a78bfa', '#fb7185', '#22d3ee']
    : ['#7c3aed', '#e11d48', '#0891b2'],
  age:     dark
    ? ['#34d399', '#22d3ee', '#60a5fa', '#a78bfa', '#fbbf24', '#94a3b8']
    : ['#059669', '#0891b2', '#2563eb', '#7c3aed', '#d97706', '#64748b'],
  funnel:  dark
    ? ['#34d399', '#22d3ee', '#a78bfa', '#fbbf24']
    : ['#059669', '#0891b2', '#7c3aed', '#d97706'],
});

export function ReportsPage() {
  const { t } = useTranslation('admin');
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme !== 'light';
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate]   = useState(() => new Date().toISOString().slice(0, 10));
  const [isExporting, setIsExporting] = useState(false);
  const [showExport, setShowExport]   = useState(false);
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);

  const { data: revenueData }      = useGetRevenueChartQuery({ period: 'day' });
  const { data: demographicsData } = useGetDemographicsQuery();
  const { data: funnelData }       = useGetConversionFunnelQuery();

  // Adaptive colors — thay thế hardcode module-level constants
  const { gender: GENDER_COLORS, age: AGE_COLORS, funnel: FUNNEL_COLORS } = getAdaptiveColors(dark);

  const revenue30   = revenueData?.data ?? [];
  const genderData: { name: string; value: number }[]   = demographicsData?.data?.gender   ?? [];
  const ageGroupData: { name: string; value: number }[] = demographicsData?.data?.ageGroups ?? [];
  const funnel      = funnelData?.data ?? [];

  const totalRevenue  = revenue30.reduce((s, r) => s + Number(r.revenue), 0);
  const totalBookings = revenue30.reduce((s, r) => s + Number(r.bookings), 0);
  const revChartData  = revenue30.slice(-30).map((d) => ({
    ...d,
    label: String((d as Record<string, unknown>).label ?? '').slice(5),
    revenueM: Number(d.revenue) / 1_000_000,
  }));

  const genderTotal = genderData.reduce((s, x) => s + x.value, 0);

  // Chart color tokens
  const muted   = dark ? '#64748b' : '#94a3b8';
  const grid    = dark ? 'rgba(255,255,255,0.04)' : 'rgba(16,185,129,0.06)';
  const fg      = dark ? '#f1f5f9' : '#0f172a';
  const tipBg   = dark ? 'rgba(13,13,18,0.96)' : 'rgba(255,255,255,0.97)';
  const tipBorder = dark ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.30)';
  const tooltipStyle = {
    contentStyle: { background: tipBg, border: `1px solid ${tipBorder}`, borderRadius: '14px', padding: '10px 14px', fontSize: 12, color: fg, backdropFilter: 'blur(20px)' },
    itemStyle: { color: muted },
    labelStyle: { color: '#10b981', marginBottom: 4, fontWeight: 700 as const },
    cursor: { fill: 'rgba(16,185,129,0.04)' },
  };

  const INPUT = `rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm text-foreground outline-none focus:border-border/60 transition-colors`;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const res = await fetch(`/api/admin/reports/export?${params}`, {
        credentials: 'include', headers: { Authorization: `Bearer ${accessToken ?? ''}` },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `bao-cao-${startDate}-${endDate}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error(t('reports.export.error')); }
    finally { setIsExporting(false); }
  };

  return (
    <div className="admin-bg space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            {t('reports.title')}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('reports.subtitle')}</p>
        </div>
        <button onClick={() => setShowExport((p) => !p)}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20 transition-all">
          <Download size={12} />
          {t('reports.export.download')}
          {showExport ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
      </div>

      {/* Export panel */}
      {showExport && (
        <div className="admin-chart-card">
          <div className="mb-3 flex items-center gap-2">
            <Download size={14} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-foreground">{t('reports.export.title')}</h2>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">{t('reports.export.description')}</p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">{t('reports.export.fromDate')}</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">{t('reports.export.toDate')}</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={INPUT} />
            </div>
            <button onClick={handleExport} disabled={isExporting}
              className="flex items-center gap-2 rounded-xl btn-glass px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {isExporting ? t('reports.export.downloading') : t('reports.export.download')}
            </button>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t('reports.kpi.revenue30d')} value={formatCurrency(totalRevenue)} icon={TrendingUp} variant="emerald"
          sparkData={revChartData.slice(-10).map((d) => Number(d.revenue))} />
        <StatCard label={t('reports.kpi.bookings30d')} value={totalBookings.toLocaleString('vi-VN')} icon={BarChart3} variant="cyan" />
        <StatCard label={t('reports.kpi.avgPerOrder')} value={formatCurrency(totalBookings > 0 ? totalRevenue / totalBookings : 0)} icon={FileText} variant="amber" />
      </div>

      {/* Revenue 30-day Chart */}
      {revChartData.length > 0 && (
        <div className="admin-chart-card">
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-foreground">{t('reports.chart.title')}</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="rptRevFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#10b981" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="rptRevStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#10b981" />
                  <stop offset="60%"  stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: muted }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: muted }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v.toFixed(1)}M`} />
              <Tooltip {...tooltipStyle}
                formatter={(v) => [`${(v as number).toFixed(2)}M ₫`, t('reports.chart.revenue')]}
                labelFormatter={(l) => `${t('reports.chart.day')} ${l}`} />
              <Area type="monotone" dataKey="revenueM"
                stroke="url(#rptRevStroke)" strokeWidth={2.5}
                fill="url(#rptRevFill)"
                dot={false}
                activeDot={{ r: 5, fill: '#10b981', stroke: 'rgba(16,185,129,0.5)', strokeWidth: 4 }}
                isAnimationActive animationDuration={1000} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Demographics — charts + tables */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Giới tính */}
        <div className="admin-chart-card">
          <div className="mb-4 flex items-center gap-2">
            <Users size={14} className="text-violet-400" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t('reports.demographics.title')}</h2>
              <p className="text-xs text-muted-foreground">{t('reports.demographics.genderSubtitle')}</p>
            </div>
          </div>

          {/* Donut chart */}
          {genderData.length > 0 && (
            <div className="flex items-center gap-4 mb-5">
              <div className="relative flex-shrink-0">
                <ResponsiveContainer width={100} height={100}>
                  <RechartsPie>
                    <Pie data={genderData} dataKey="value" cx="50%" cy="50%"
                      innerRadius={30} outerRadius={46} paddingAngle={3} strokeWidth={0}
                      isAnimationActive animationDuration={800}>
                      {genderData.map((_: unknown, i: number) => (
                        <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle}
                      formatter={(v) => [Number(v).toLocaleString('vi-VN'), t('dashboard.demographics.tooltipCount')]}
                      labelFormatter={(l) => t(`reports.demographics.genderNames.${l}`, { defaultValue: l })} />
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-bold text-foreground">{genderTotal.toLocaleString('vi-VN')}</span>
                  <span className="text-[8px] text-muted-foreground/60">total</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {genderData.map((d, i) => {
                  const pct = genderTotal > 0 ? (d.value / genderTotal) * 100 : 0;
                  return (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ background: GENDER_COLORS[i % GENDER_COLORS.length] }} />
                      <span className="text-xs text-muted-foreground truncate flex-1">
                        {t(`reports.demographics.genderNames.${d.name}`, { defaultValue: d.name })}
                      </span>
                      <span className="text-xs font-semibold text-foreground tabular-nums">{pct.toFixed(1)}%</span>
                      <span className="text-[10px] text-muted-foreground/60">{d.value.toLocaleString('vi-VN')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Table fallback */}
          <div className="border-t border-admin-border pt-3 space-y-1.5">
            {genderData.map((d, i) => {
              const total = genderData.reduce((s, x) => s + x.value, 0);
              const pct   = total > 0 ? (d.value / total) * 100 : 0;
              return (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-foreground w-16 flex-shrink-0">
                    {t(`reports.demographics.genderNames.${d.name}`, { defaultValue: d.name })}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: GENDER_COLORS[i % GENDER_COLORS.length] }} />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{pct.toFixed(1)}%</span>
                </div>
              );
            })}
            {genderData.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">{t('reports.demographics.noData')}</p>}
          </div>
        </div>

        {/* Nhóm tuổi */}
        <div className="admin-chart-card">
          <div className="mb-4 flex items-center gap-2">
            <PieChart size={14} className="text-cyan-400" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t('reports.demographics.ageTitle')}</h2>
              <p className="text-xs text-muted-foreground">{t('reports.demographics.ageSubtitle')}</p>
            </div>
          </div>
          <div className="space-y-3">
            {ageGroupData.map((d, i) => {
              const total = ageGroupData.reduce((s, x) => s + x.value, 0);
              const pct   = total > 0 ? (d.value / total) * 100 : 0;
              return (
                <div key={d.name} className="flex items-center gap-3">
                  <div className="w-16 flex-shrink-0">
                    <span className="text-xs font-medium text-foreground">
                      {t(`reports.demographics.ageNames.${d.name}`, { defaultValue: d.name })}
                    </span>
                  </div>
                  <div className="flex-1 h-5 rounded-lg bg-foreground/[0.04] overflow-hidden relative">
                    <div className="h-full rounded-lg flex items-center transition-all duration-700"
                      style={{
                        width: `${Math.max(pct, 4)}%`,
                        background: `linear-gradient(90deg, ${AGE_COLORS[i % AGE_COLORS.length]}, ${AGE_COLORS[i % AGE_COLORS.length]}99)`,
                        boxShadow: `0 0 8px ${AGE_COLORS[i % AGE_COLORS.length]}55`,
                      }}>
                      <span className="px-2 text-[10px] font-bold text-white whitespace-nowrap">
                        {d.value.toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  <span className="w-10 text-right text-xs font-semibold text-foreground tabular-nums">{pct.toFixed(1)}%</span>
                </div>
              );
            })}
            {ageGroupData.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">{t('reports.demographics.noData')}</p>}
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      {funnel.length > 0 && (
        <div className="admin-chart-card">
          <div className="mb-5 flex items-center gap-2">
            <Activity size={14} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-foreground">{t('reports.funnel.title')}</h2>
          </div>
          <div className="space-y-3">
            {funnel.map((item: { stage: string; value: number }, i: number) => {
              const max  = funnel[0]?.value || 1;
              const pct  = Math.min(100, Math.round((item.value / max) * 100));
              const prev = i > 0 ? funnel[i - 1]?.value : null;
              const drop = prev ? Math.round(((prev - item.value) / prev) * 100) : null;
              const color = FUNNEL_COLORS[i];
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-24 flex-shrink-0 text-right">
                    <span className="text-xs text-muted-foreground">
                      {(t(`reports.funnel.stages.${i}`) as string) || item.stage}
                    </span>
                  </div>
                  <div className="flex-1 h-8 rounded-xl bg-foreground/[0.04] overflow-hidden relative border border-foreground/[0.04]">
                    <div className="h-full rounded-xl flex items-center transition-all duration-700"
                      style={{
                        width: `${Math.max(pct, 6)}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}bb)`,
                        boxShadow: `0 0 16px ${color}44`,
                      }}>
                      <span className="px-3 text-[10px] font-bold text-white whitespace-nowrap">
                        {i === 3 ? formatCurrency(item.value) : item.value.toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  <div className="w-14 text-right flex-shrink-0">
                    {drop !== null && drop > 0
                      ? <span className="text-[10px] text-rose-400 font-medium">↓{drop}%</span>
                      : <span className="text-xs font-bold text-foreground tabular-nums">{pct}%</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
