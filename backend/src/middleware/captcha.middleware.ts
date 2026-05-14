import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { apiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

// Verify Cloudflare Turnstile token
export async function verifyCaptcha(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Bỏ qua captcha trong development nếu dùng test key
  const testKey = '1x0000000000000000000000000000000AA';
  if (env.turnstile.secretKey === testKey || env.nodeEnv === 'test') {
    next();
    return;
  }

  const token = req.body.turnstileToken;
  if (!token) {
    apiResponse.badRequest(res, 'Vui lòng hoàn thành xác minh CAPTCHA');
    return;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', env.turnstile.secretKey);
    formData.append('response', token);
    formData.append('remoteip', req.ip || '');

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const data = await result.json() as { success: boolean };
    if (!data.success) {
      apiResponse.badRequest(res, 'Xác minh CAPTCHA thất bại');
      return;
    }
    next();
  } catch (err) {
    logger.error('Lỗi verify captcha:', err as Error);
    // Không block khi service Turnstile lỗi — log và cho qua
    next();
  }
}
