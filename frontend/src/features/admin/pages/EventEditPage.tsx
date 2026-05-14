import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { Save, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGetAdminEventDetailQuery, useUpdateEventMutation, useGetVenuesQuery } from '../services/adminApi';
import { cn } from '../../../shared/utils/cn';
import { toast } from 'sonner';

// Dùng string types cho HTML inputs (select/number input trả về string)
// Chuyển đổi sang number trong onSubmit
interface EditForm {
  title: string;
  category: string;
  shortDescription: string;
  description: string;
  bannerUrl: string;
  venueId: string;
  startTime: string;
  endTime: string;
  saleStartTime: string;
  maxTicketsPerUser: string;
  queueEnabled: boolean;
}

function toLocalDatetime(iso: string) {
  return iso ? new Date(iso).toISOString().slice(0, 16) : '';
}

const CATEGORY_OPTIONS = [
  { value: 'music', label: 'Âm nhạc' }, { value: 'sports', label: 'Thể thao' },
  { value: 'theater', label: 'Sân khấu' }, { value: 'comedy', label: 'Hài kịch' },
  { value: 'festival', label: 'Festival' }, { value: 'conference', label: 'Hội thảo' },
  { value: 'other', label: 'Khác' },
];

export function EventEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('admin');
  const { data, isLoading } = useGetAdminEventDetailQuery(Number(id), { skip: !id });
  const { data: venuesData } = useGetVenuesQuery();
  const [updateEvent, { isLoading: isSaving }] = useUpdateEventMutation();
  const venues = venuesData?.data ?? [];
  const event = data?.data;

  const { register, handleSubmit, reset, formState: { isDirty, errors } } = useForm<EditForm>();

  // Pre-fill form khi có dữ liệu event — venueId/maxTicketsPerUser là string vì HTML input
  useEffect(() => {
    if (!event) return;
    reset({
      title: event.title,
      category: event.category,
      shortDescription: event.short_description ?? '',
      description: event.description ?? '',
      bannerUrl: event.banner_url ?? '',
      venueId: String(event.venue_id),
      startTime: toLocalDatetime(event.start_time),
      endTime: toLocalDatetime(event.end_time),
      saleStartTime: toLocalDatetime(event.sale_start_time),
      maxTicketsPerUser: String(event.max_tickets_per_user),
      queueEnabled: event.queue_enabled,
    });
  }, [event, reset]);

  const onSubmit = async (data: EditForm) => {
    // Validate thủ công vì không dùng zodResolver
    if (!data.title?.trim()) { toast.error(t('wizardForm.validation.titleRequired')); return; }
    if (!Number(data.venueId)) { toast.error(t('wizardForm.validation.venueRequired')); return; }
    if (!data.startTime) { toast.error(t('wizardForm.validation.startTimeRequired')); return; }
    if (!data.endTime) { toast.error(t('wizardForm.validation.endTimeRequired')); return; }
    if (!data.saleStartTime) { toast.error(t('wizardForm.validation.saleStartRequired')); return; }

    try {
      await updateEvent({
        id: Number(id),
        title: data.title,
        category: data.category,
        shortDescription: data.shortDescription,
        description: data.description,
        bannerUrl: data.bannerUrl || null,
        thumbnailUrl: data.bannerUrl || null,
        venueId: Number(data.venueId),
        startTime: data.startTime,
        endTime: data.endTime,
        saleStartTime: data.saleStartTime,
        maxTicketsPerUser: Number(data.maxTicketsPerUser),
        queueEnabled: data.queueEnabled,
      }).unwrap();
      toast.success('Cập nhật sự kiện thành công');
      navigate('/admin/events');
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message || 'Đã xảy ra lỗi');
    }
  };

  if (isLoading) return (
    <div className="flex h-64 items-center justify-center gap-3">
      <Loader2 size={22} className="text-emerald-400 animate-spin" />
      <span className="text-sm text-muted-foreground">Đang tải dữ liệu sự kiện...</span>
    </div>
  );
  if (!event) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-red-500/15 bg-red-500/[0.04]">
      <AlertCircle size={40} className="text-red-400/60" />
      <p className="text-sm font-medium text-foreground">Không tìm thấy sự kiện</p>
      <button onClick={() => navigate('/admin/events')}
        className="flex items-center gap-1.5 rounded-xl btn-glass px-4 py-2 text-sm font-medium">
        <ArrowLeft size={14} /> Quay lại danh sách
      </button>
    </div>
  );

  const inputClass = (hasError: boolean) => cn(
    'w-full rounded-xl border bg-admin-input px-3 py-2.5 text-sm text-foreground outline-none',
    'placeholder:text-muted-foreground/50 focus:border-border/60 transition-colors',
    hasError ? 'border-error/60' : 'border-admin-border',
  );

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/admin/events')} className="rounded-lg p-2 text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground/80 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Sửa sự kiện</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{event.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left */}
        <div className="admin-chart-card space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('wizardForm.fields.title')}</label>
            <input {...register('title', { required: t('wizardForm.validation.titleRequired'), minLength: { value: 3, message: 'Tên tối thiểu 3 ký tự' } })} className={inputClass(!!errors.title)} placeholder={t('wizardForm.placeholders.title')} />
            {errors.title && <p className="mt-1 text-xs text-error">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('wizardForm.fields.category')}</label>
              <select {...register('category')} className={inputClass(false)}>
                {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('wizardForm.fields.venue')}</label>
              <select {...register('venueId')} className={inputClass(!!errors.venueId)}>
                <option value="">-- Chọn địa điểm --</option>
                {venues.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.city}</option>)}
              </select>
              {errors.venueId && <p className="mt-1 text-xs text-error">{errors.venueId.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('wizardForm.fields.shortDesc')}</label>
            <textarea {...register('shortDescription')} rows={2} className={cn(inputClass(false), 'resize-none')} placeholder={t('wizardForm.placeholders.shortDesc')} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('wizardForm.fields.description')}</label>
            <textarea {...register('description')} rows={4} className={cn(inputClass(false), 'resize-y')} placeholder={t('wizardForm.placeholders.description')} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('wizardForm.fields.banner')}</label>
            <input {...register('bannerUrl')} type="url" className={inputClass(!!errors.bannerUrl)} placeholder={t('wizardForm.placeholders.banner')} />
            {errors.bannerUrl && <p className="mt-1 text-xs text-error">{errors.bannerUrl.message}</p>}
          </div>
        </div>

        {/* Right */}
        <div className="admin-chart-card space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('wizardForm.fields.startTime')}</label>
            <input {...register('startTime')} type="datetime-local" className={inputClass(!!errors.startTime)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('wizardForm.fields.endTime')}</label>
            <input {...register('endTime')} type="datetime-local" className={inputClass(!!errors.endTime)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('wizardForm.fields.saleStart')}</label>
            <input {...register('saleStartTime')} type="datetime-local" className={inputClass(!!errors.saleStartTime)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('wizardForm.fields.maxTickets')}</label>
            <input {...register('maxTicketsPerUser')} type="number" min={1} max={20} className={inputClass(false)} />
          </div>
          {/* Custom toggle cho queueEnabled */}
          <div className="flex items-center justify-between rounded-xl border border-admin-border bg-foreground/[0.02] px-4 py-3">
            <div>
              <p className="text-sm text-foreground">{t('wizardForm.fields.queueEnabled')}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">Bật hàng đợi ảo khi lưu lượng cao</p>
            </div>
            <label className="relative cursor-pointer">
              <input {...register('queueEnabled')} type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 rounded-full border-2 border-foreground/20 bg-foreground/[0.06] peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all duration-200" />
              <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 peer-checked:translate-x-5" />
            </label>
          </div>

          <button type="submit" disabled={isSaving || !isDirty}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl btn-glass py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}
