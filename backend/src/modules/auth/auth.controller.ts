import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { apiResponse } from '../../utils/apiResponse';
import { env } from '../../config/env';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
  path: '/',
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, fullName } = req.body;
      const { user, accessToken, refreshToken } = await AuthService.register(email, password, fullName);

      res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

      apiResponse.created(res, {
        accessToken,
        user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, emailVerified: user.email_verified },
      }, 'Đăng ký thành công');
    } catch (err) { next(err); }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const deviceInfo = req.headers['user-agent'];
      const ipAddress = req.ip;

      const { user, accessToken, refreshToken } = await AuthService.login(email, password, deviceInfo, ipAddress);

      res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

      apiResponse.success(res, {
        accessToken,
        user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, emailVerified: user.email_verified, avatarUrl: user.avatar_url, phone: user.phone ?? null },
      }, 'Đăng nhập thành công');
    } catch (err) { next(err); }
  }

  static async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { googleIdToken } = req.body;
      const { user, accessToken, refreshToken, isNew } = await AuthService.googleAuth(googleIdToken);

      res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

      apiResponse.success(res, {
        accessToken,
        isNew,
        user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, emailVerified: user.email_verified, avatarUrl: user.avatar_url, phone: user.phone ?? null },
      }, isNew ? 'Đăng ký thành công bằng Google' : 'Đăng nhập thành công bằng Google');
    } catch (err) { next(err); }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawToken = req.cookies?.refreshToken;
      if (!rawToken) { apiResponse.unauthorized(res, 'Refresh token không tồn tại'); return; }

      const { accessToken, refreshToken, user } = await AuthService.refreshToken(rawToken);
      res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

      apiResponse.success(res, {
        accessToken,
        user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, emailVerified: user.email_verified, avatarUrl: user.avatar_url, phone: user.phone ?? null },
      }, 'Làm mới token thành công');
    } catch (err) { next(err); }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawToken = req.cookies?.refreshToken;
      if (rawToken) await AuthService.logout(rawToken);

      res.clearCookie('refreshToken', { path: '/' });
      apiResponse.success(res, null, 'Đăng xuất thành công');
    } catch (err) { next(err); }
  }

  static async me(req: Request, res: Response): Promise<void> {
    const { User: UserModel } = await import('../../models/User');
    const user = await UserModel.findByPk(req.user!.id, {
      attributes: { exclude: ['password_hash', 'email_verify_token'] },
    });
    if (!user) { apiResponse.notFound(res, 'Người dùng không tồn tại'); return; }
    apiResponse.success(res, user);
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.verifyEmail(req.body.token);
      apiResponse.success(res, null, 'Xác minh email thành công');
    } catch (err) { next(err); }
  }

  static async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.resendVerification(req.user!.id);
      apiResponse.success(res, null, 'Đã gửi lại email xác minh');
    } catch (err) { next(err); }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.forgotPassword(req.body.email);
      apiResponse.success(res, null, 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu');
    } catch (err) { next(err); }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.resetPassword(req.body.token, req.body.newPassword);
      apiResponse.success(res, null, 'Đặt lại mật khẩu thành công');
    } catch (err) { next(err); }
  }
}
