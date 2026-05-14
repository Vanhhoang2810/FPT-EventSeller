import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useGetBookingQuery } from '../services/bookingApi';

export function MomoReturnPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const resultCode = params.get('resultCode');
  const isSuccess  = resultCode === '0';

  const [polling, setPolling] = useState(isSuccess);
  const [failed, setFailed]   = useState(!isSuccess);
  const [ambiguous, setAmbiguous] = useState(false);
  const attempts = useRef(0);

  const { refetch } = useGetBookingQuery(Number(bookingId), {
    skip: !bookingId || !isSuccess,
  });

  useEffect(() => {
    if (!isSuccess || !bookingId) return;

    const interval = setInterval(async () => {
      attempts.current += 1;
      try {
        const res = await refetch();
        const status = res.data?.data?.status;

        if (status === 'confirmed') {
          clearInterval(interval);
          navigate(`/booking-success/${bookingId}`, { replace: true });
          return;
        }

        // Booking bị huỷ/hết hạn — hiện lỗi
        if (status === 'cancelled' || status === 'expired') {
          clearInterval(interval);
          setPolling(false);
          setFailed(true);
          return;
        }
      } catch {
        // refetch lỗi — tiếp tục poll, không navigate
      }

      if (attempts.current >= 12) {
        clearInterval(interval);
        setPolling(false);
        // Sau 12s vẫn chưa xác nhận → ambiguous state, không force navigate success
        setAmbiguous(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSuccess, bookingId, navigate, refetch]);

  const message = params.get('message') ?? 'Thanh toán thất bại';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center px-6">
        {polling ? (
          <>
            <Loader2 size={40} className="animate-spin text-primary-700 dark:text-primary-400" />
            <p className="text-base font-semibold text-foreground">Đang xác nhận thanh toán MoMo...</p>
            <p className="text-sm text-muted-foreground">Vui lòng đợi, không tắt trang này</p>
          </>
        ) : ambiguous ? (
          <>
            <Loader2 size={40} className="text-amber-400" />
            <p className="text-base font-semibold text-foreground">Đang xử lý thanh toán</p>
            <p className="text-sm text-muted-foreground">Giao dịch đang được xác nhận. Kiểm tra email hoặc lịch sử đơn hàng sau vài phút.</p>
            <button
              onClick={() => navigate('/my-tickets', { replace: true })}
              className="mt-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              Xem lịch sử vé
            </button>
          </>
        ) : failed ? (
          <>
            <XCircle size={40} className="text-error" />
            <p className="text-base font-semibold text-foreground">Thanh toán không thành công</p>
            <p className="text-sm text-muted-foreground">{message}</p>
            <button
              onClick={() => navigate(bookingId ? `/checkout/${bookingId}` : '/events', { replace: true })}
              className="mt-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              Quay lại trang thanh toán
            </button>
          </>
        ) : (
          <>
            <CheckCircle size={40} className="text-success" />
            <p className="text-sm text-muted-foreground">Đang chuyển hướng...</p>
          </>
        )}
      </div>
    </div>
  );
}
