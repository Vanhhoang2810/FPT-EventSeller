import { emailTransporter } from '../../config/email';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

const BASE_STYLES = `
  font-family: 'Inter', -apple-system, sans-serif;
  background-color: #09090B;
  color: #FAFAFA;
`;

const BUTTON_STYLE = `
  display: inline-block;
  padding: 14px 32px;
  background: linear-gradient(135deg, #059669, #047857);
  color: #ffffff;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
`;

const CARD_STYLE = `
  background: #18181B;
  border: 1px solid #3F3F46;
  border-radius: 12px;
  padding: 40px;
  max-width: 560px;
  margin: 0 auto;
`;

function buildEmail(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="${BASE_STYLES} margin: 0; padding: 24px;">
  <div style="${CARD_STYLE}">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 28px; font-weight: 800; color: #10B981; margin: 0; letter-spacing: -0.5px;">
        Ticket<span style="color: #F97316;">Rush</span>
      </h1>
    </div>
    ${body}
    <hr style="border: none; border-top: 1px solid #3F3F46; margin: 32px 0;">
    <p style="font-size: 12px; color: #71717A; text-align: center; margin: 0;">
      © 2026 Ticket Rush. Mọi quyền được bảo lưu.<br>
      Đây là email tự động, vui lòng không trả lời.
    </p>
  </div>
</body>
</html>`;
}

export class EmailService {
  static async sendVerificationEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const verifyUrl = `${env.clientUrl}/verify-email?token=${token}`;
    const html = buildEmail('Xác minh email', `
      <h2 style="color: #FAFAFA; font-size: 22px; margin-bottom: 8px;">Xin chào ${name}!</h2>
      <p style="color: #A1A1AA; line-height: 1.6; margin-bottom: 24px;">
        Cảm ơn bạn đã đăng ký tài khoản Ticket Rush. Vui lòng nhấn nút bên dưới để xác minh địa chỉ email của bạn.
      </p>
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${verifyUrl}" style="${BUTTON_STYLE}">Xác minh email</a>
      </div>
      <p style="color: #71717A; font-size: 14px; text-align: center;">
        Link sẽ hết hạn sau 24 giờ. Nếu bạn không đăng ký, hãy bỏ qua email này.
      </p>
    `);

    await this.send(to, 'Xác minh email — Ticket Rush', html);
  }

  static async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const html = buildEmail('Chào mừng đến Ticket Rush', `
      <h2 style="color: #FAFAFA; font-size: 22px; margin-bottom: 8px;">Chào mừng ${name}! 🎉</h2>
      <p style="color: #A1A1AA; line-height: 1.6; margin-bottom: 24px;">
        Bạn đã tham gia Ticket Rush thành công. Khám phá hàng ngàn sự kiện âm nhạc, thể thao, sân khấu ngay hôm nay.
      </p>
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${env.clientUrl}/events" style="${BUTTON_STYLE}">Khám phá sự kiện</a>
      </div>
    `);

    await this.send(to, 'Chào mừng đến Ticket Rush!', html);
  }

  static async sendPasswordResetEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const resetUrl = `${env.clientUrl}/reset-password?token=${token}`;
    const html = buildEmail('Đặt lại mật khẩu', `
      <h2 style="color: #FAFAFA; font-size: 22px; margin-bottom: 8px;">Đặt lại mật khẩu</h2>
      <p style="color: #A1A1AA; line-height: 1.6; margin-bottom: 24px;">
        Xin chào ${name}, chúng tôi nhận được yêu cầu đặt lại mật khẩu tài khoản của bạn.
      </p>
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${resetUrl}" style="${BUTTON_STYLE}; background: linear-gradient(135deg, #F97316, #EA580C);">
          Đặt lại mật khẩu
        </a>
      </div>
      <p style="color: #71717A; font-size: 14px; text-align: center;">
        Link sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu, hãy bỏ qua email này.
      </p>
    `);

    await this.send(to, 'Đặt lại mật khẩu — Ticket Rush', html);
  }

  static async sendBookingConfirmedEmail(
    to: string,
    name: string,
    bookingDetails: { eventTitle: string; seats: string[]; totalAmount: number; bookingId: number },
  ): Promise<void> {
    const formattedAmount = new Intl.NumberFormat('vi-VN').format(bookingDetails.totalAmount) + '₫';
    const html = buildEmail('Đặt vé thành công', `
      <h2 style="color: #10B981; font-size: 22px; margin-bottom: 8px;">✅ Đặt vé thành công!</h2>
      <p style="color: #A1A1AA; line-height: 1.6; margin-bottom: 24px;">
        Xin chào ${name}, đặt vé của bạn đã được xác nhận.
      </p>
      <div style="background: #27272A; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="color: #FAFAFA; margin: 0 0 8px;"><strong>Sự kiện:</strong> ${bookingDetails.eventTitle}</p>
        <p style="color: #FAFAFA; margin: 0 0 8px;"><strong>Ghế:</strong> ${bookingDetails.seats.join(', ')}</p>
        <p style="color: #10B981; margin: 0; font-size: 18px;"><strong>Tổng: ${formattedAmount}</strong></p>
      </div>
      <div style="text-align: center;">
        <a href="${env.clientUrl}/my-tickets/${bookingDetails.bookingId}" style="${BUTTON_STYLE}">Xem vé của tôi</a>
      </div>
    `);

    await this.send(to, `Đặt vé thành công — ${bookingDetails.eventTitle}`, html);
  }

  private static async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await emailTransporter.sendMail({
        from: env.smtp.from,
        to,
        subject,
        html,
      });
      logger.debug(`Email đã gửi tới ${to}: ${subject}`);
    } catch (err) {
      logger.error(`Gửi email thất bại tới ${to}:`, err as Error);
      // Không throw — email failure không nên block flow chính
    }
  }
}
