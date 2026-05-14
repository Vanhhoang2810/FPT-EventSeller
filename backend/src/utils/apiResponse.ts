import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const apiResponse = {
  success(res: Response, data: unknown = null, message = 'Thao tác thành công', statusCode = 200) {
    return res.status(statusCode).json({ success: true, data, message });
  },

  paginated(res: Response, data: unknown[], pagination: PaginationMeta, message = 'Thành công') {
    return res.status(200).json({ success: true, data, pagination, message });
  },

  error(res: Response, message = 'Đã xảy ra lỗi', statusCode = 500, errors?: unknown[]) {
    const body: Record<string, unknown> = { success: false, message };
    if (errors) body.errors = errors;
    return res.status(statusCode).json(body);
  },

  created(res: Response, data: unknown, message = 'Tạo thành công') {
    return this.success(res, data, message, 201);
  },

  notFound(res: Response, message = 'Không tìm thấy') {
    return this.error(res, message, 404);
  },

  unauthorized(res: Response, message = 'Chưa xác thực') {
    return this.error(res, message, 401);
  },

  forbidden(res: Response, message = 'Không có quyền truy cập') {
    return this.error(res, message, 403);
  },

  badRequest(res: Response, message = 'Dữ liệu không hợp lệ', errors?: unknown[]) {
    return this.error(res, message, 400, errors);
  },
};
