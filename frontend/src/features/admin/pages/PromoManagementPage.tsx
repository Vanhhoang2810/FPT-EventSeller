import { useState } from 'react';
import { Plus, ToggleLeft, ToggleRight, Tag, X, Check, Percent, DollarSign, Clock, Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGetPromosQuery, useCreatePromoMutation, useTogglePromoMutation, useUpdatePromoMutation, useDeletePromoMutation } from '../services/adminApi';
import { ConfirmButton } from '../../../shared/components/ConfirmButton';
import { formatDateTime } from '../../../shared/utils/formatDate';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import { toast } from 'sonner';
import { cn } from '../../../shared/utils/cn';

const INPUT_CLS = 'w-full rounded-xl border border-admin-border bg-admin-input px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-border/60 transition-colors';
const LABEL_CLS = 'mb-1 block text-xs text-muted-foreground';

const TABLE_TH = 'px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60';

function makeDefaultForm() {
  const now = new Date();
  const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    code: '', discountType: 'fixed', discountValue: 50000,
    usageLimit: '', perUserLimit: 1, minAmount: 0,
    startsAt: now.toISOString().slice(0, 16),
    expiresAt: future.toISOString().slice(0, 16),
  };
}

export function PromoManagementPage() {
  const { t } = useTranslation('admin');
  const { data, isLoading } = useGetPromosQuery();
  const [createPromo, { isLoading: isCreating }] = useCreatePromoMutation();
  const [updatePromo, { isLoading: isUpdating }] = useUpdatePromoMutation();
  const [togglePromo] = useTogglePromoMutation();
  const [deletePromo] = useDeletePromoMutation();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(makeDefaultForm);

  const promos = data?.data ?? [];
  const now = new Date();
  const active = promos.filter((p) => p.is_active && new Date(p.expires_at) > now);
  const inactive = promos.filter((p) => !p.is_active || new Date(p.expires_at) <= now);

  const handleCreate = async () => {
    if (!form.code.trim()) { toast.error(t('promo.toast.codeRequired')); return; }
    try {
      await createPromo({
        code: form.code.toUpperCase(),
        discountType: form.discountType,
        discountValue: form.discountValue,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        perUserLimit: form.perUserLimit,
        minAmount: form.minAmount,
        startsAt: form.startsAt,
        expiresAt: form.expiresAt,
      }).unwrap();
      toast.success(t('promo.toast.createSuccess'));
      setShowForm(false);
      setForm(makeDefaultForm());
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message || t('promo.toast.error'));
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await togglePromo(id).unwrap();
    } catch { toast.error(t('promo.toast.toggleError')); }
  };

  const handleUpdate = async () => {
    if (!editId) return;
    try {
      await updatePromo({
        id: editId,
        discountType: form.discountType,
        discountValue: form.discountValue,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        perUserLimit: form.perUserLimit,
        minAmount: form.minAmount,
        startsAt: form.startsAt,
        expiresAt: form.expiresAt,
      }).unwrap();
      toast.success(t('promo.toast.updateSuccess'));
      setEditId(null); setShowForm(false); setForm(makeDefaultForm());
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message || t('promo.toast.error'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePromo(id).unwrap();
      toast.success(t('promo.toast.deleteSuccess'));
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message || t('promo.toast.error'));
    }
  };

  const openEdit = (p: typeof promos[0]) => {
    setEditId(p.id);
    setForm({
      code: p.code,
      discountType: p.discount_type,
      discountValue: Number(p.discount_value),
      usageLimit: p.usage_limit ? String(p.usage_limit) : '',
      perUserLimit: p.per_user_limit,
      minAmount: Number(p.min_amount),
      startsAt: p.starts_at ? new Date(p.starts_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      expiresAt: new Date(p.expires_at).toISOString().slice(0, 16),
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            {t('promo.title')}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('promo.subtitle', { active: active.length, total: promos.length })}</p>
        </div>
        <button
          onClick={() => setShowForm((p) => !p)}
          className="flex items-center gap-1.5 rounded-xl btn-glass px-4 py-2 text-sm font-semibold hover:opacity-90 transition-colors"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? t('promo.cancelButton') : t('promo.createButton')}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Tag size={14} className="text-primary" />
            {editId ? t('promo.form.editTitle') : t('promo.form.title')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="col-span-2 sm:col-span-1">
              <label className={LABEL_CLS}>{t('promo.form.fields.code')}</label>
              <input
                value={form.code}
                readOnly={!!editId}
                onChange={(e) => !editId && setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder={t('promo.form.placeholders.code')}
                className={cn(INPUT_CLS, 'font-mono uppercase tracking-widest', editId && 'opacity-60 cursor-not-allowed')}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>{t('promo.form.fields.discountType')}</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value }))}
                className={cn(INPUT_CLS, 'cursor-pointer')}
              >
                <option value="fixed">{t('promo.form.discountTypes.fixed')}</option>
                <option value="percentage">{t('promo.form.discountTypes.percentage')}</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>{t('promo.form.fields.discountValue')}</label>
              <input
                type="number" value={form.discountValue}
                onChange={(e) => setForm((p) => ({ ...p, discountValue: Number(e.target.value) }))}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>{t('promo.form.fields.minAmount')}</label>
              <input
                type="number" value={form.minAmount}
                onChange={(e) => setForm((p) => ({ ...p, minAmount: Number(e.target.value) }))}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>{t('promo.form.fields.usageLimit')}</label>
              <input
                type="number" value={form.usageLimit}
                onChange={(e) => setForm((p) => ({ ...p, usageLimit: e.target.value }))}
                placeholder={t('promo.form.placeholders.usageLimit')}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>{t('promo.form.fields.perUserLimit')}</label>
              <input
                type="number" min={1} value={form.perUserLimit}
                onChange={(e) => setForm((p) => ({ ...p, perUserLimit: Number(e.target.value) }))}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>{t('promo.form.fields.startsAt')}</label>
              <input type="datetime-local" value={form.startsAt}
                onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))}
                className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>{t('promo.form.fields.expiresAt')}</label>
              <input type="datetime-local" value={form.expiresAt}
                onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                className={INPUT_CLS} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(makeDefaultForm()); }}
              className="rounded-xl border border-admin-border px-4 py-2 text-sm text-muted-foreground hover:bg-foreground/[0.04]">
              {t('promo.form.cancel')}
            </button>
            <button
              onClick={editId ? handleUpdate : handleCreate}
              disabled={isCreating || isUpdating}
              className="flex items-center gap-1.5 rounded-xl btn-glass px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              <Check size={14} />
              {editId
                ? (isUpdating ? t('promo.form.creating') : t('promo.form.update'))
                : (isCreating ? t('promo.form.creating') : t('promo.form.create'))
              }
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-foreground/[0.03] animate-pulse" />)}
        </div>
      ) : promos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-admin-border bg-foreground/[0.02] py-20">
          <Tag size={40} className="text-muted-foreground/50 mb-4" />
          <p className="text-sm font-medium text-muted-foreground">{t('promo.empty.title')}</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-xs text-primary hover:text-primary-300">
            {t('promo.empty.createFirst')}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Active */}
          {active.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {t('promo.sections.active', { count: active.length })}
              </p>
              <div className="admin-chart-card p-0"><div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="border-b border-foreground/[0.05]">
                      <th className={TABLE_TH}>{t('promo.columns.code')}</th>
                      <th className={TABLE_TH}>{t('promo.columns.discount')}</th>
                      <th className={cn(TABLE_TH, 'hidden md:table-cell')}>{t('promo.columns.used')}</th>
                      <th className={cn(TABLE_TH, 'hidden lg:table-cell')}>{t('promo.columns.expires')}</th>
                      <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{t('promo.columns.toggle')}</th>
                      <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{t('promo.columns.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {active.map((p, i) => (
                      <tr key={p.id} className={cn('border-b border-foreground/[0.04] hover:bg-foreground/[0.025] transition-colors', i === active.length - 1 && 'border-b-0')}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                              <Tag size={12} className="text-primary" />
                            </div>
                            <span className="font-mono text-sm font-bold text-foreground tracking-wider">{p.code}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {p.discount_type === 'percentage'
                              ? <><Percent size={11} className="text-accent-400" /><span className="text-sm font-semibold text-accent-400">{p.discount_value}%</span></>
                              : <><DollarSign size={11} className="text-primary" /><span className="text-sm font-semibold text-primary">{formatCurrency(Number(p.discount_value))}</span></>
                            }
                          </div>
                          {p.min_amount > 0 && (
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">{t('promo.minAmount', { amount: formatCurrency(p.min_amount) })}</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-foreground/[0.06] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: p.usage_limit ? `${Math.min(100, (p.usage_count / p.usage_limit) * 100)}%` : '0%' }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{p.usage_count}/{p.usage_limit ?? '∞'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Clock size={11} className="text-muted-foreground/60" />
                            <span className="text-xs text-muted-foreground">{formatDateTime(p.expires_at)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => handleToggle(p.id)}
                            className="text-primary hover:text-primary-300 transition-colors"
                            title={t('promo.toggleOff')}
                          >
                            <ToggleRight size={22} />
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(p)}
                              className="rounded-lg p-1.5 text-muted-foreground/60 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
                              title="Sửa">
                              <Edit2 size={13} />
                            </button>
                            <ConfirmButton onConfirm={() => handleDelete(p.id)}
                              label="Xóa mã này?" confirmLabel="Xóa"
                              className="rounded-lg p-1.5 text-muted-foreground/60 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                              <Trash2 size={13} />
                            </ConfirmButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>{/* overflow / card */}
            </div>
          )}

          {/* Inactive */}
          {inactive.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {t('promo.sections.inactive', { count: inactive.length })}
              </p>
              <div className="admin-chart-card p-0 opacity-60"><div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="border-b border-foreground/[0.05]">
                      <th className={TABLE_TH}>{t('promo.columns.code')}</th>
                      <th className={TABLE_TH}>{t('promo.columns.discount')}</th>
                      <th className={cn(TABLE_TH, 'hidden md:table-cell')}>{t('promo.columns.used')}</th>
                      <th className={cn(TABLE_TH, 'hidden lg:table-cell')}>{t('promo.columns.expires')}</th>
                      <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{t('promo.columns.enable')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inactive.map((p, i) => (
                      <tr key={p.id} className={cn('border-b border-foreground/[0.04] hover:bg-foreground/[0.02] transition-colors', i === inactive.length - 1 && 'border-b-0')}>
                        <td className="px-5 py-3">
                          <span className="font-mono text-sm text-muted-foreground line-through tracking-wider">{p.code}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs text-muted-foreground/60">
                            {p.discount_type === 'percentage' ? `${p.discount_value}%` : formatCurrency(Number(p.discount_value))}
                          </span>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell">
                          <span className="text-xs text-muted-foreground/60">{p.usage_count}/{p.usage_limit ?? '∞'}</span>
                        </td>
                        <td className="px-5 py-3 hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground/60">{formatDateTime(p.expires_at)}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => handleToggle(p.id)}
                            className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                            title={t('promo.toggleOn')}
                          >
                            <ToggleLeft size={22} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>{/* overflow / card */}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
