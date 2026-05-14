import { useState } from 'react';
import { Plus, Edit2, Trash2, Building2, MapPin, Users2, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ConfirmButton } from '../../../shared/components/ConfirmButton';
import { useGetVenuesQuery, useCreateVenueMutation, useUpdateVenueMutation, useDeleteVenueMutation } from '../services/adminApi';
import type { Venue } from '../services/adminApi';
import { toast } from 'sonner';

function VenueForm({
  initial, onSave, onCancel,
}: { initial?: Partial<Venue>; onSave: (d: Partial<Venue>) => void; onCancel: () => void }) {
  const { t } = useTranslation('admin');
  const [d, setD] = useState({
    name: initial?.name ?? '',
    address: initial?.address ?? '',
    city: initial?.city ?? '',
    capacity: initial?.capacity ?? 500,
  });
  const isEdit = !!initial?.id;

  return (
    <div className="admin-chart-card border-emerald-500/20" style={{ background: 'rgba(16,185,129,0.04)' }}>
      <h3 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
        <Building2 size={14} className="text-emerald-400" />
        {isEdit ? t('venues.form.editTitle') : t('venues.form.addTitle')}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {[
          { label: t('venues.form.fields.name'), key: 'name', span: 2, placeholder: t('venues.form.placeholders.name') },
          { label: t('venues.form.fields.city'), key: 'city', placeholder: t('venues.form.placeholders.city') },
          { label: t('venues.form.fields.capacity'), key: 'capacity', type: 'number', placeholder: t('venues.form.placeholders.capacity') },
          { label: t('venues.form.fields.address'), key: 'address', span: 2, placeholder: t('venues.form.placeholders.address') },
        ].map(({ label, key, span, type, placeholder }) => (
          <div key={key} className={span === 2 ? 'col-span-2' : ''}>
            <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
            <input
              type={type ?? 'text'}
              value={String(d[key as keyof typeof d])}
              onChange={(e) => setD((p) => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
              placeholder={placeholder}
              className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-border/60 transition-colors"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-xl border border-admin-border px-4 py-2 text-sm text-muted-foreground hover:bg-foreground/[0.04] transition-colors"
        >
          <X size={13} /> {t('venues.form.cancel')}
        </button>
        <button
          onClick={() => onSave(d)}
          disabled={!d.name.trim() || !d.address.trim()}
          className="flex items-center gap-1.5 rounded-xl btn-glass px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Check size={13} /> {isEdit ? t('venues.form.update') : t('venues.form.create')}
        </button>
      </div>
    </div>
  );
}

export function VenueManagementPage() {
  const { t } = useTranslation('admin');
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const { data, refetch } = useGetVenuesQuery();
  const [createVenue] = useCreateVenueMutation();
  const [updateVenue] = useUpdateVenueMutation();
  const [deleteVenue] = useDeleteVenueMutation();

  const venues = data?.data ?? [];

  const handleCreate = async (d: Partial<Venue>) => {
    try {
      await createVenue(d).unwrap();
      toast.success(t('venues.toast.createSuccess'));
      setAdding(false);
      refetch();
    } catch { toast.error(t('venues.toast.error')); }
  };

  const handleUpdate = async (id: number, d: Partial<Venue>) => {
    try {
      await updateVenue({ id, ...d }).unwrap();
      toast.success(t('venues.toast.updateSuccess'));
      setEditId(null);
      refetch();
    } catch { toast.error(t('venues.toast.error')); }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteVenue(id).unwrap();
      toast.success(t('venues.toast.deleteSuccess'));
      refetch();
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message || t('venues.toast.deleteError'));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            {t('venues.title')}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('venues.subtitle', { count: venues.length })}</p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-xl btn-glass px-4 py-2 text-sm font-semibold hover:opacity-90 transition-colors"
          >
            <Plus size={15} /> {t('venues.addButton')}
          </button>
        )}
      </div>

      {adding && (
        <VenueForm onSave={handleCreate} onCancel={() => setAdding(false)} />
      )}

      {venues.length === 0 && !adding ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.02] py-20">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
            <Building2 size={28} className="text-emerald-400/60" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{t('venues.empty.title')}</p>
          <button onClick={() => setAdding(true)} className="mt-3 text-xs text-primary hover:text-primary-300">
            {t('venues.empty.addFirst')}
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((v) => (
            <div key={v.id}>
              {editId === v.id ? (
                <VenueForm
                  initial={v}
                  onSave={(d) => handleUpdate(v.id, d)}
                  onCancel={() => setEditId(null)}
                />
              ) : (
                <div className="group relative rounded-2xl border border-admin-border bg-admin-surface p-5 transition-all duration-200
                  hover:border-emerald-500/25 hover:shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:-translate-y-0.5">
                  {/* Actions */}
                  <div className="absolute right-4 top-4 flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    <button onClick={() => setEditId(v.id)}
                      className="rounded-lg p-1.5 text-muted-foreground/60 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <ConfirmButton onConfirm={() => handleDelete(v.id)}
                      label={t('venues.confirmDelete')} confirmLabel={t('venues.confirmDeleteLabel')}
                      className="rounded-lg p-1.5 text-muted-foreground/60 hover:bg-red-500/10 hover:text-error transition-colors">
                      <Trash2 size={13} />
                    </ConfirmButton>
                  </div>

                  {/* Icon — emerald vibrant */}
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/25 ring-4 ring-emerald-500/[0.06]">
                    <Building2 size={18} className="text-emerald-400" />
                  </div>

                  {/* Info */}
                  <h3 className="mb-2.5 text-sm font-semibold text-foreground pr-14 leading-snug">{v.name}</h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin size={11} className="text-emerald-400/60 flex-shrink-0" />
                      <span className="truncate">{v.address}{v.city ? `, ${v.city}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users2 size={11} className="text-cyan-400/60 flex-shrink-0" />
                      <span>{t('venues.seating', { count: v.capacity.toLocaleString('vi-VN') })}</span>
                    </div>
                  </div>

                  {/* Capacity mini bar */}
                  <div className="mt-3 pt-3 border-t border-admin-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground/60">Sức chứa</span>
                      <span className="text-[10px] font-semibold text-foreground">{v.capacity.toLocaleString('vi-VN')}</span>
                    </div>
                    <div className="h-1 rounded-full bg-foreground/[0.06] overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (v.capacity / 50000) * 100)}%`,
                          background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                        }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
