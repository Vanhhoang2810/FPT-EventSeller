import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { apiResponse } from '../utils/apiResponse';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    apiResponse.unauthorized(res, 'Vui lòng đăng nhập');
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.jwt.accessSecret) as Express.User;
    req.user = payload;
    next();
  } catch {
    apiResponse.unauthorized(res, 'Token không hợp lệ hoặc đã hết hạn');
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    apiResponse.unauthorized(res);
    return;
  }
  if (req.user.role !== 'admin') {
    apiResponse.forbidden(res, 'Chỉ admin mới có quyền truy cập');
    return;
  }
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) { next(); return; }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.jwt.accessSecret) as Express.User;
    req.user = payload;
  } catch { /* token không hợp lệ — bỏ qua, không block */ }
  next();
}
