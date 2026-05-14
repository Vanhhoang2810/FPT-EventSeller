import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCreateEventMutation, useGetVenuesQuery, useSetupZonesMutation, useUpdateEventStatusMutation } from '../services/adminApi';
import { SeatMapBuilder } from '../components/seat-map/SeatMapBuilder';
import type { ZoneConfig } from '../components/seat-map/SeatMapBuilder';
import { cn } from '../../../shared/utils/cn';
import { toast } from 'sonner';

const STEPS = ['Thông tin cơ bản', 'Địa điểm & Thời gian', 'Sơ đồ ghế', 'Cài đặt bán vé', 'Xem trước & Đăng'];

const step1Schema = z.object({
  title: z.string().min(3, 'Tên tối thiểu 3 ký tự'),
  category: z.enum(['music', 'sports', 'theater', 'comedy', 'festival', 'conference', 'other']),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  bannerUrl: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
});

const step2Schema = z.object({
  venueId: z.coerce.number().int().positive('Chọn địa điểm'),
  startTime: z.string().min(1, 'Chọn ngày bắt đầu'),
  endTime: z.string().min(1, 'Chọn ngày kết thúc'),
  saleStartTime: z.string().min(1, 'Chọn thời điểm mở bán'),
});

const LABEL = 'mb-1.5 block text-xs font-medium text-muted-foreground';
const INPUT = 'w-full rounded-xl border border-admin-border bg-admin-input px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-border/60 transition-colors';
const ERROR = 'mt-1 text-[11px] text-red-400';
const BTN_BACK = 'flex items-center gap-1.5 rounded-xl border border-foreground/[0.07] px-5 py-2.5 text-sm text-muted-foreground hover:bg-foreground/[0.04] transition-colors';
const BTN_NEXT = 'flex items-center gap-1.5 rounded-xl btn-glass px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const CATEGORY_OPTIONS = [
  { value: 'music', label: 'Âm nhạc' }, { value: 'sports', label: 'Thể thao' },
  { value: 'theater', label: 'Sân khấu' }, { value: 'comedy', label: 'Hài kịch' },
  { value: 'festival', label: 'Festival' }, { value: 'conference', label: 'Hội thảo' },
  { value: 'other', label: 'Khác' },
];

export function EventCreatePage() {
  const navigate = useNavigate();
  const { t } = useTranslation('admin');
  const [step, setStep] = useState(0);
  const [zones, setZones] = useState<ZoneConfig[]>([
    { name: 'VIP', price: 800000, colorCode: '#059669', rowsCount: 3, seatsPerRow: 15 },
    { name: 'Hạng A', price: 500000, colorCode: '#3B82F6', rowsCount: 5, seatsPerRow: 20 },
  ]);
  const [step4Data, setStep4Data] = useState({ maxTicketsPerUser: 5, queueEnabled: false });

  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [setupZones, { isLoading: isSettingZones }] = useSetupZonesMutation();
  const [updateStatus] = useUpdateEventStatusMutation();
  const { data: venuesData } = useGetVenuesQuery();
  const venues = venuesData?.data ?? [];

  const form1 = useForm({ resolver: zodResolver(step1Schema), defaultValues: { title: '', category: 'music', shortDescription: '', description: '', bannerUrl: '' } });
  const form2 = useForm({ resolver: zodResolver(step2Schema) });

  const handleStep1 = () => setStep(1);
  const handleStep2 = () => setStep(2);

  const handlePublish = async (publish: boolean) => {
    const [valid1, valid2] = await Promise.all([form1.trigger(), form2.trigger()]);
    const d1 = form1.getValues();
    const d2 = form2.getValues();
    if (!valid1) { setStep(0); return; }
    if (!d1.title?.trim() || d1.title.trim().length < 3) { toast.error(t('wizardForm.validation.titleRequired')); setStep(0); return; }
    if (!d2.venueId) { toast.error(t('wizardForm.validation.venueRequired')); setStep(1); return; }
    if (!d2.startTime || !d2.endTime || !d2.saleStartTime) { toast.error(t('wizardForm.validation.startTimeRequired')); setStep(1); return; }

    try {
      const event = await createEvent({
        title: d1.title, category: d1.category,
        shortDescription: d1.shortDescription, description: d1.description,
        bannerUrl: d1.bannerUrl || null, thumbnailUrl: d1.bannerUrl || null,
        venueId: d2.venueId, startTime: d2.startTime,
        endTime: d2.endTime, saleStartTime: d2.saleStartTime,
        maxTicketsPerUser: step4Data.maxTicketsPerUser,
        queueEnabled: step4Data.queueEnabled,
      }).unwrap();

      const newId = event.data.id;
      if (zones.length > 0) await setupZones({ id: newId, zones }).unwrap();
      if (publish) { await updateStatus({ id: newId, status: 'published' }).unwrap(); toast.success('Sự kiện đã được đăng thành công!'); }
      else toast.success('Đã lưu nháp');
      navigate('/admin/events');
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message || 'Đã xảy ra lỗi');
    }
  };

  const totalSeats = zones.reduce((s, z) => s + z.rowsCount * z.seatsPerRow, 0);
  const isSubmitting = isCreating || isSettingZones;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          Tạo sự kiện mới
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">Hoàn thành {STEPS.length} bước để đăng sự kiện</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          const clickable = done; // Cho phép quay lại bước đã hoàn thành
          return (
            <div key={i} className="flex items-center gap-1">
              <button
                type="button"
                disabled={!clickable && !active}
                onClick={() => { if (clickable) setStep(i); }}
                title={clickable ? `Quay lại: ${s}` : s}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                  done ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 cursor-pointer hover:scale-110 hover:bg-emerald-500/30' : '',
                  active ? 'bg-emerald-500 text-white shadow-[0_0_14px_rgba(16,185,129,0.6)] ring-2 ring-emerald-500/30' : '',
                  !done && !active ? 'bg-foreground/[0.06] border border-foreground/[0.08] text-muted-foreground/50' : '',
                )}
              >
                {done ? <Check size={12} /> : i + 1}
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn('h-px w-8 transition-all duration-300',
                  done ? 'bg-gradient-to-r from-emerald-500/60 to-emerald-500/30' : 'bg-foreground/[0.08]'
                )} />
              )}
            </div>
          );
        })}
        <span className="ml-3 text-xs text-muted-foreground">
          Bước {step + 1}/{STEPS.length}: <span className="text-foreground/80 font-medium">{STEPS[step]}</span>
        </span>
      </div>

      {/* Card content */}
      <div className="admin-chart-card">
        {/* Step title inside card */}
        <h2 className="mb-5 text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
            {step + 1}
          </span>
          {STEPS[step]}
        </h2>

        {/* ── Step 1 ── */}
        {step === 0 && (
          <form onSubmit={form1.handleSubmit(handleStep1)} className="space-y-4">
            <div>
              <label className={LABEL}>{t('wizardForm.fields.title')}</label>
              <input {...form1.register('title')} className={INPUT} placeholder={t('wizardForm.placeholders.title')} />
              {form1.formState.errors.title && <p className={ERROR}>{form1.formState.errors.title.message}</p>}
            </div>
            <div>
              <label className={LABEL}>{t('wizardForm.fields.category')}</label>
              <select {...form1.register('category')} className={cn(INPUT, 'cursor-pointer')}>
                {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>{t('wizardForm.fields.shortDesc')}</label>
              <textarea {...form1.register('shortDescription')} rows={2} className={cn(INPUT, 'resize-none')} placeholder={t('wizardForm.placeholders.shortDesc')} />
            </div>
            <div>
              <label className={LABEL}>{t('wizardForm.fields.banner')}</label>
              <input {...form1.register('bannerUrl')} type="url" className={INPUT} placeholder={t('wizardForm.placeholders.banner')} />
              {form1.formState.errors.bannerUrl && <p className={ERROR}>{form1.formState.errors.bannerUrl.message}</p>}
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className={BTN_NEXT}>
                {t('wizard.actions.next')} <ChevronRight size={15} />
              </button>
            </div>
          </form>
        )}

        {/* ── Step 2 ── */}
        {step === 1 && (
          <form onSubmit={form2.handleSubmit(handleStep2)} className="space-y-4">
            <div>
              <label className={LABEL}>{t('wizardForm.fields.venue')}</label>
              <select {...form2.register('venueId')} className={cn(INPUT, 'cursor-pointer')}>
                <option value="">-- Chọn địa điểm --</option>
                {venues.map((v) => <option key={v.id} value={v.id}>{v.name}{v.city ? ` — ${v.city}` : ''}</option>)}
              </select>
              {form2.formState.errors.venueId && <p className={ERROR}>{form2.formState.errors.venueId.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>{t('wizardForm.fields.startTime')}</label>
                <input {...form2.register('startTime')} type="datetime-local" className={INPUT} />
                {form2.formState.errors.startTime && <p className={ERROR}>{form2.formState.errors.startTime.message}</p>}
              </div>
              <div>
                <label className={LABEL}>{t('wizardForm.fields.endTime')}</label>
                <input {...form2.register('endTime')} type="datetime-local" className={INPUT} />
              </div>
            </div>
            <div>
              <label className={LABEL}>{t('wizardForm.fields.saleStart')}</label>
              <input {...form2.register('saleStartTime')} type="datetime-local" className={INPUT} />
            </div>
            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setStep(0)} className={BTN_BACK}>
                <ChevronLeft size={15} /> {t('wizard.actions.back')}
              </button>
              <button type="submit" className={BTN_NEXT}>
                {t('wizard.actions.next')} <ChevronRight size={15} />
              </button>
            </div>
          </form>
        )}

        {/* ── Step 3: SeatMapBuilder ── */}
        {step === 2 && (
          <div className="space-y-5">
            <SeatMapBuilder zones={zones} onChange={setZones} />
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className={BTN_BACK}>
                <ChevronLeft size={15} /> {t('wizard.actions.back')}
              </button>
              <button onClick={() => setStep(3)} className={BTN_NEXT}>
                {t('wizard.actions.next')} <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Cài đặt bán vé ── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className={LABEL}>{t('wizardForm.fields.maxTickets')}</label>
              <input
                type="number" min={1} max={20} value={step4Data.maxTicketsPerUser}
                onChange={(e) => setStep4Data((p) => ({ ...p, maxTicketsPerUser: Number(e.target.value) }))}
                className={cn(INPUT, 'max-w-[160px]')}
              />
              <p className="mt-1 text-xs text-muted-foreground/60">Mỗi tài khoản chỉ được mua tối đa số vé này cho 1 sự kiện</p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox" checked={step4Data.queueEnabled}
                  onChange={(e) => setStep4Data((p) => ({ ...p, queueEnabled: e.target.checked }))}
                  className="sr-only"
                />
                <div className={cn(
                  'h-4 w-4 rounded border transition-colors flex items-center justify-center',
                  step4Data.queueEnabled ? 'bg-primary border-primary' : 'border-foreground/20 bg-foreground/[0.04]',
                )}>
                  {step4Data.queueEnabled && <Check size={10} className="text-black" />}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground group-hover:text-foreground">{t('wizardForm.fields.queueEnabled')}</p>
                <p className="text-xs text-muted-foreground/60">{t('wizardForm.fields.queueEnabled_desc')}</p>
              </div>
            </label>
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(2)} className={BTN_BACK}>
                <ChevronLeft size={15} /> {t('wizard.actions.back')}
              </button>
              <button onClick={() => setStep(4)} className={BTN_NEXT}>
                {t('wizard.steps.preview')} <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Preview & Publish ── */}
        {step === 4 && (
          <div className="space-y-5">
            {/* Preview card */}
            <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] divide-y divide-foreground/[0.04]">
              {[
                { label: 'Tên sự kiện', value: form1.getValues('title') || '—' },
                { label: 'Thể loại', value: CATEGORY_OPTIONS.find((o) => o.value === form1.getValues('category'))?.label || '—' },
                { label: 'Địa điểm', value: venues.find((v) => v.id === Number(form2.getValues('venueId')))?.name || '—' },
                { label: 'Tổng ghế', value: `${totalSeats.toLocaleString('vi-VN')} ghế (${zones.length} khu)` },
                { label: 'Tối đa / người', value: `${step4Data.maxTicketsPerUser} vé` },
                { label: 'Virtual Queue', value: step4Data.queueEnabled ? '✓ Đã bật' : 'Tắt' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-medium text-foreground text-right max-w-[60%]">{value}</span>
                </div>
              ))}
            </div>

            {zones.length === 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 text-xs text-amber-400">
                ⚠️ Chưa cấu hình sơ đồ ghế — sự kiện sẽ được lưu không có ghế
              </div>
            )}

            <div className="flex justify-between gap-3">
              <button onClick={() => setStep(3)} className={BTN_BACK} disabled={isSubmitting}>
                <ChevronLeft size={15} /> {t('wizard.actions.back')}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePublish(false)}
                  disabled={isSubmitting}
                  className="rounded-xl border border-foreground/[0.07] px-5 py-2.5 text-sm text-muted-foreground hover:bg-foreground/[0.04] disabled:opacity-50 transition-colors"
                >
                  {t('wizardForm.preview.draft')}
                </button>
                <button
                  onClick={() => handlePublish(true)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl btn-glass px-6 py-2.5 text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? (
                    <><Loader2 size={14} className="animate-spin" /> {t('wizardForm.preview.publishing')}</>
                  ) : (
                    <><Check size={14} /> {t('wizardForm.preview.publish')}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
