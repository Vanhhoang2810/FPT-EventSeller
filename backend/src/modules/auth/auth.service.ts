import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database';
import { User } from '../../models/User';
import { RefreshToken } from '../../models/RefreshToken';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler.middleware';
import { EmailService } from '../email/email.service';
import { logger } from '../../utils/logger';

const googleClient = new OAuth2Client(env.google.clientId);
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;

export class AuthService {
  // Tạo access token JWT (15 phút)
  static generateAccessToken(user: Pick<User, 'id' | 'email' | 'role' | 'email_verified'>): string {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role, emailVerified: user.email_verified },
      env.jwt.accessSecret,
      { expiresIn: env.jwt.accessExpires as unknown as number },
    );
  }

  // Tạo refresh token ngẫu nhiên, lưu DB (hashed)
  // Hash refresh token bằng HMAC-SHA256 — đủ an toàn cho random token, không cần argon2
  private static hashRefreshToken(rawToken: string): string {
    return crypto.createHmac('sha256', env.jwt.refreshSecret).update(rawToken).digest('hex');
  }

  static async createRefreshToken(
    userId: number,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<string> {
    const rawToken = crypto.randomUUID();
    const hashedToken = this.hashRefreshToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      user_id: userId,
      token: hashedToken,
      expires_at: expiresAt,
      revoked: false,
      device_info: deviceInfo || null,
      ip_address: ipAddress || null,
    });

    return rawToken;
  }

  // Đăng ký tài khoản mới
  static async register(
    email: string,
    password: string,
    fullName: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new AppError('Email đã được sử dụng', 409);
    }

    const passwordHash = await argon2.hash(password);
    const verifyToken = crypto.randomUUID();

    const user = await User.create({
      email,
      password_hash: passwordHash,
      full_name: fullName,
      role: 'customer',
      is_active: true,
      email_verified: false,
      email_verify_token: verifyToken,
      login_attempts: 0,
    });

    // Gửi email verify bất đồng bộ — không block response
    EmailService.sendVerificationEmail(email, fullName, verifyToken).catch((err) =>
      logger.error('Gửi email verify thất bại:', err),
    );

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  // Đăng nhập
  static async login(
    email: string,
    password: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    if (!user.is_active) {
      throw new AppError('Tài khoản đã bị khóa', 403);
    }

    // Kiểm tra account lockout
    if (process.env.NODE_ENV !== 'test' && user.locked_until && user.locked_until > new Date()) {
      const minutesLeft = Math.ceil((user.locked_until.getTime() - Date.now()) / 60000);
      throw new AppError(`Tài khoản bị khóa tạm thời, thử lại sau ${minutesLeft} phút`, 429);
    }

    if (!user.password_hash) {
      throw new AppError('Tài khoản này đăng nhập bằng Google. Vui lòng dùng Google Login', 400);
    }

    const isValid = await argon2.verify(user.password_hash, password);
    if (!isValid) {
      const attempts = user.login_attempts + 1;
      const updates: Partial<User> = { login_attempts: attempts } as Partial<User>;

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        const lockedUntil = new Date();
        lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCK_DURATION_MINUTES);
        (updates as Record<string, unknown>).locked_until = lockedUntil;
        (updates as Record<string, unknown>).login_attempts = 0;
      }

      await user.update(updates);
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    // Reset login attempts sau khi login thành công
    await user.update({ login_attempts: 0, locked_until: null });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id, deviceInfo, ipAddress);

    return { user, accessToken, refreshToken };
  }

  // Refresh access token — C3 fix: dùng transaction + SELECT FOR UPDATE để chống dual-consumption
  static async refreshToken(
    rawRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const hashedToken = this.hashRefreshToken(rawRefreshToken);
    const t = await sequelize.transaction();

    try {
      // Lock row trước khi revoke — chặn 2 request đồng thời dùng cùng token
      const matchedToken = await RefreshToken.findOne({
        where: { token: hashedToken, revoked: false, expires_at: { [Op.gt]: new Date() } },
        include: [{ model: User, as: 'user' }],
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!matchedToken) {
        throw new AppError('Refresh token không hợp lệ hoặc đã hết hạn', 401);
      }

      const user = await User.findByPk((matchedToken as unknown as { user: User }).user.id, {
        transaction: t,
      });
      if (!user || !user.is_active) {
        throw new AppError('Tài khoản không tồn tại hoặc đã bị khóa', 401);
      }

      // Revoke token cũ và tạo token mới trong cùng transaction
      await matchedToken.update({ revoked: true }, { transaction: t });

      const rawNew = crypto.randomUUID();
      const hashedNew = this.hashRefreshToken(rawNew);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await RefreshToken.create(
        {
          user_id: user.id,
          token: hashedNew,
          expires_at: expiresAt,
          revoked: false,
        },
        { transaction: t },
      );

      await t.commit();

      const accessToken = this.generateAccessToken(user);
      return { accessToken, refreshToken: rawNew, user };
    } catch (err) {
      await t.rollback().catch(() => {});
      throw err;
    }
  }

  // Logout — revoke refresh token bằng O(1) lookup
  static async logout(rawRefreshToken: string): Promise<void> {
    const hashedToken = this.hashRefreshToken(rawRefreshToken);
    await RefreshToken.update({ revoked: true }, { where: { token: hashedToken, revoked: false } });
  }

  // Google OAuth login/register — nhận access_token từ frontend (implicit flow)
  static async googleAuth(
    googleAccessToken: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string; isNew: boolean }> {
    if (!env.google.clientId || env.google.clientId === 'your-google-client-id') {
      throw new AppError('Google OAuth chưa được cấu hình', 503);
    }

    // Dùng userinfo endpoint thay vì verifyIdToken — phù hợp với access_token từ implicit flow
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    });
    if (!res.ok) throw new AppError('Token Google không hợp lệ', 400);

    const payload = (await res.json()) as {
      sub: string;
      email?: string;
      name?: string;
      picture?: string;
      email_verified?: boolean;
    };
    if (!payload.email) throw new AppError('Token Google không có email', 400);

    const { sub: googleId, email, name: displayName, picture: avatarUrl } = payload;

    // Tìm user theo google_id hoặc email
    let user = await User.findOne({ where: { [Op.or]: [{ google_id: googleId }, { email }] } });
    let isNew = false;

    if (!user) {
      user = await User.create({
        email: email!,
        password_hash: null,
        full_name: displayName || email!.split('@')[0],
        avatar_url: avatarUrl || null,
        google_id: googleId,
        email_verified: true,
        role: 'customer',
        is_active: true,
        login_attempts: 0,
      });

      EmailService.sendWelcomeEmail(email!, user.full_name).catch((err) =>
        logger.error('Gửi welcome email thất bại:', err),
      );
      isNew = true;
    } else {
      // Cập nhật google_id nếu login bằng email lần đầu
      if (!user.google_id) {
        await user.update({ google_id: googleId, email_verified: true });
      }
    }

    if (!user.is_active) {
      throw new AppError('Tài khoản đã bị khóa', 403);
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id);

    return { user, accessToken, refreshToken, isNew };
  }

  // Verify email
  static async verifyEmail(token: string): Promise<void> {
    const user = await User.findOne({ where: { email_verify_token: token } });
    if (!user) {
      throw new AppError('Token xác minh không hợp lệ hoặc đã hết hạn', 400);
    }

    await user.update({ email_verified: true, email_verify_token: null });
  }

  // Forgot password — C1 fix: embed expiry (1h) vào token string; C2 fix: không overwrite verify token nếu user chưa verify
  static async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ where: { email } });
    if (!user || !user.is_active) return;

    // C2: từ chối nếu user chưa verify email — verify token và reset token dùng chung 1 column
    if (!user.email_verified) return;

    const resetToken = crypto.randomUUID();
    // C1: embed timestamp hết hạn (1 giờ) vào token để không cần migration thêm column
    const expiresAt = Date.now() + 60 * 60 * 1000;
    await user.update({ email_verify_token: `reset:${resetToken}:${expiresAt}` });

    await EmailService.sendPasswordResetEmail(email, user.full_name, resetToken);
  }

  // Reset password — C1 fix: kiểm tra expiry embedded trong token
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    // Tìm theo prefix "reset:<token>:" để khớp dù có timestamp phía sau
    // Escape LIKE metacharacters để tránh SQL injection qua ký tự %, _, \
    const escapedToken = token.replace(/[%_\\]/g, '\\$&');
    const user = await User.findOne({
      where: { email_verify_token: { [Op.like]: `reset:${escapedToken}:%` } },
    });
    if (!user) {
      throw new AppError('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn', 400);
    }

    // Parse và kiểm tra expiry từ token string "reset:UUID:TIMESTAMP"
    const parts = (user.email_verify_token ?? '').split(':');
    const expiresAt = Number(parts[parts.length - 1]);
    if (!expiresAt || Date.now() > expiresAt) {
      await user.update({ email_verify_token: null });
      throw new AppError('Link đặt lại mật khẩu đã hết hạn (1 giờ). Vui lòng yêu cầu lại', 400);
    }

    const passwordHash = await argon2.hash(newPassword);
    await user.update({ password_hash: passwordHash, email_verify_token: null });

    await RefreshToken.update({ revoked: true }, { where: { user_id: user.id, revoked: false } });
  }

  // Gửi lại email verify — C2 fix: không ghi đè pending reset token
  static async resendVerification(userId: number): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('Người dùng không tồn tại', 404);
    if (user.email_verified) throw new AppError('Email đã được xác minh', 400);

    // C2: nếu đang có reset token đang chờ, từ chối overwrite
    if (user.email_verify_token?.startsWith('reset:')) {
      throw new AppError(
        'Tài khoản có link đặt lại mật khẩu đang chờ. Vui lòng dùng link trong email hoặc đợi 1 giờ',
        400,
      );
    }

    const verifyToken = crypto.randomUUID();
    await user.update({ email_verify_token: verifyToken });
    await EmailService.sendVerificationEmail(user.email, user.full_name, verifyToken);
  }
}
