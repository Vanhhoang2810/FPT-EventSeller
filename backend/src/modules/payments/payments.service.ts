import crypto from 'crypto';
import qs from 'qs';
import axios from 'axios';
import { Booking } from '../../models/Booking';
import { BookingSeat } from '../../models/BookingSeat';
import { AppError } from '../../middleware/errorHandler.middleware';
import { BookingService } from '../booking/booking.service';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

// sortObject theo VNPay official docs — encode key + value, space thành '+'
function sortObject(obj: Record<string, string>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).map(k => encodeURIComponent(k)).sort();
  for (const key of keys) {
    const original = decodeURIComponent(key);
    sorted[key] = encodeURIComponent(String(obj[original])).replace(/%20/g, '+');
  }
  return sorted;
}

export class PaymentsService {
  // VNPay: tạo URL thanh toán
  // finalAmount: số tiền sau discount (total_amount - discount_amount)
  static createVnPayUrl(booking: Booking, ipAddr: string, finalAmount?: number): string {
    const date = new Date();
    // VNPay yêu cầu giờ Việt Nam (UTC+7), không phải UTC
    const vnDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    const createDate = vnDate.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    // Dùng bookingId + timestamp đầy đủ để tránh collision
    const txnRef = `${booking.id}-${date.getTime()}`;

    const chargeAmount = finalAmount ?? Math.max(0, Number(booking.total_amount) - Number(booking.discount_amount));

    // Strip IPv6-mapped IPv4 prefix (::ffff:x.x.x.x → x.x.x.x) — VNPay chỉ nhận IPv4
    const cleanIp = (ipAddr || '127.0.0.1').replace(/^::ffff:/, '').replace(/^::1$/, '127.0.0.1');

    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: env.vnpay.tmnCode,
      vnp_Amount: String(Math.round(chargeAmount * 100)),
      vnp_CreateDate: createDate,
      vnp_CurrCode: 'VND',
      vnp_IpAddr: cleanIp,
      vnp_Locale: 'vn',
      vnp_OrderInfo: `Thanh toan ve so ${booking.id}`,
      vnp_OrderType: 'other',
      // vnp_ReturnUrl: redirect browser về sau thanh toán
      vnp_ReturnUrl: `${env.apiUrl}/api/payments/vnpay/return`,
      // vnp_IpnUrl: VNPay gọi server-to-server để xác nhận GD — gửi động, không cần cấu hình trên merchant portal
      vnp_IpnUrl: `${env.apiUrl}/api/payments/vnpay/ipn`,
      vnp_TxnRef: txnRef,
    };

    const sorted = sortObject(params);
    const signData = qs.stringify(sorted, { encode: false });
    logger.debug(`[VNPay] signData: ${signData}`);
    const signed = crypto.createHmac('sha512', env.vnpay.hashSecret)
      .update(Buffer.from(signData, 'utf-8')).digest('hex');
    sorted['vnp_SecureHash'] = signed;

    return `${env.vnpay.url}?${qs.stringify(sorted, { encode: false })}`;
  }

  // VNPay return callback
  static async handleVnPayReturn(query: Record<string, string>) {
    const secureHash = query.vnp_SecureHash;
    const params = { ...query };
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;

    const sorted = sortObject(params as Record<string, string>);
    const signData = qs.stringify(sorted, { encode: false });
    const signed = crypto.createHmac('sha512', env.vnpay.hashSecret)
      .update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (signed !== secureHash) {
      throw new AppError('Chữ ký không hợp lệ', 400);
    }

    // txnRef format: "bookingId-timestamp" — lấy phần trước dấu "-"
    const bookingId = Number(query.vnp_TxnRef?.split('-')[0]);
    const responseCode = query.vnp_ResponseCode;
    const transactionId = query.vnp_TransactionNo;

    const booking = await Booking.findOne({
      where: { id: bookingId, status: 'pending' },
      include: [{ model: BookingSeat, as: 'bookingSeats' }],
    });

    if (!booking) throw new AppError('Không tìm thấy đơn đặt vé', 404);
    if (booking.expires_at < new Date()) {
      await BookingService.expireBooking(booking);
      return { success: false, redirectUrl: `${env.clientUrl}/checkout/${bookingId}?error=expired` };
    }

    if (responseCode === '00') {
      await BookingService.confirmBooking(booking, Math.max(0, Number(booking.total_amount) - Number(booking.discount_amount)), Number(booking.discount_amount), booking.promo_code_id, 'vnpay', transactionId);
      return { success: true, redirectUrl: `${env.clientUrl}/booking-success/${bookingId}` };
    }

    return { success: false, redirectUrl: `${env.clientUrl}/checkout/${bookingId}?error=payment_failed` };
  }

  // VNPay IPN — server-to-server callback, trả JSON cho VNPay
  static async handleVnPayIpn(query: Record<string, string>) {
    const secureHash = query.vnp_SecureHash;
    if (!secureHash) return { RspCode: '97', Message: 'Missing checksum' };

    const params = { ...query };
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;

    const sorted = sortObject(params);
    const signData = qs.stringify(sorted, { encode: false });
    const signed = crypto.createHmac('sha512', env.vnpay.hashSecret)
      .update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (signed !== secureHash) return { RspCode: '97', Message: 'Invalid checksum' };

    const bookingId = Number(query.vnp_TxnRef?.split('-')[0]);
    const responseCode = query.vnp_ResponseCode;
    const transactionId = query.vnp_TransactionNo;

    const booking = await Booking.findOne({
      where: { id: bookingId, status: 'pending' },
      include: [{ model: BookingSeat, as: 'bookingSeats' }],
    });

    if (!booking) return { RspCode: '01', Message: 'Order not found' };
    if (booking.expires_at < new Date()) return { RspCode: '02', Message: 'Order expired' };

    if (responseCode === '00') {
      try {
        await BookingService.confirmBooking(
          booking, Math.max(0, Number(booking.total_amount) - Number(booking.discount_amount)), Number(booking.discount_amount),
          booking.promo_code_id, 'vnpay', transactionId,
        );
        return { RspCode: '00', Message: 'Confirm Success' };
      } catch {
        return { RspCode: '02', Message: 'Order already confirmed' };
      }
    }

    // IPN cho giao dịch thất bại — expire booking ngay, không đợi BullMQ (tối đa 30s)
    try { await BookingService.expireBooking(booking); } catch { /* best-effort */ }
    return { RspCode: '00', Message: 'Confirm Success' };
  }

  // MoMo: tạo payment request
  static async createMoMoPayment(booking: Booking) {
    const orderId = `BOOKING-${booking.id}-${Date.now()}`;
    const requestId = orderId;
    const amount = String(Math.max(0, Math.round(Number(booking.total_amount) - Number(booking.discount_amount))));
    const orderInfo = `Thanh toan ve #${booking.id}`;
    const redirectUrl = `${env.clientUrl}/checkout/${booking.id}/momo-return`;
    const ipnUrl = `${env.apiUrl}/api/payments/momo/ipn`;
    const requestType = 'payWithMethod';
    const extraData = '';

    const rawSignature = `accessKey=${env.momo.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${env.momo.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto.createHmac('sha256', env.momo.secretKey).update(rawSignature).digest('hex');

    const body = {
      partnerCode: env.momo.partnerCode,
      accessKey: env.momo.accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      requestType,
      extraData,
      lang: 'vi',
      signature,
    };

    try {
      const { data } = await axios.post(env.momo.endpoint, body);
      return data;
    } catch (err) {
      logger.error('MoMo API lỗi:', err as Error);
      throw new AppError('Không thể kết nối cổng thanh toán MoMo', 503);
    }
  }

  // MoMo IPN callback
  static async handleMoMoIpn(body: Record<string, string>) {
    const { orderId, resultCode, transId } = body;
    const bookingId = Number(orderId.split('-')[1]);

    const booking = await Booking.findOne({
      where: { id: bookingId, status: 'pending' },
      include: [{ model: BookingSeat, as: 'bookingSeats' }],
    });

    if (!booking) return { success: false };

    // resultCode=9000 = authorized chưa capture — chỉ confirm khi =0 (fully settled)
    if (String(resultCode) === '0') {
      await BookingService.confirmBooking(booking, Math.max(0, Number(booking.total_amount) - Number(booking.discount_amount)), Number(booking.discount_amount), booking.promo_code_id, 'momo', transId);
      return { success: true };
    }

    // MoMo payment failed — expire booking ngay (nhất quán với VNPay IPN)
    try { await BookingService.expireBooking(booking); } catch { /* best-effort */ }
    return { success: false };
  }
}
