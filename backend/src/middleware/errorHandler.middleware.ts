import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public errors?: unknown[],
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ZodError — validation thất bại
  if (err instanceof ZodError) {
    const errors = err.issues.map((e) => ({ field: String(e.path.join('.')), message: e.message }));
    res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors });
    return;
  }

  // AppError — lỗi business logic có chủ ý
  if (err instanceof AppError) {
    const body: Record<string, unknown> = { success: false, message: err.message };
    if (err.errors) body.errors = err.errors;
    res.status(err.statusCode).json(body);
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, message: 'Token không hợp lệ' });
    return;
  }
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Token đã hết hạn' });
    return;
  }

  // Sequelize errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    res.status(409).json({ success: false, message: 'Dữ liệu đã tồn tại' });
    return;
  }
  if (err.name === 'SequelizeValidationError') {
    res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    return;
  }

  // Lỗi không xác định — log internal, trả về generic
  logger.error(`[${req.requestId}] ${err.message}`, err);
  res.status(500).json({ success: false, message: 'Đã xảy ra lỗi, vui lòng thử lại' });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ success: false, message: `Không tìm thấy route: ${req.path}` });
}
