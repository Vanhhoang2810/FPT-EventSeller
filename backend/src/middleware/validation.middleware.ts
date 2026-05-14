import { Request, Response, NextFunction } from 'express';
import { apiResponse } from '../utils/apiResponse';

interface ParseableSchema {
  safeParse(data: unknown): { success: boolean; data?: unknown; error?: { issues: { path: PropertyKey[]; message: string }[] } };
}

// Attach validated/coerced data to req.validated (cho query, params)
// body ghi trực tiếp — Express 5 chỉ read-only với query/params
declare global {
  namespace Express {
    interface Request {
      validated?: Record<string, unknown>;
    }
  }
}

export function validate(schema: ParseableSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = (result.error?.issues ?? []).map((e) => ({
        field: e.path.map(String).join('.'),
        message: e.message,
      }));
      apiResponse.badRequest(res, 'Dữ liệu không hợp lệ', errors);
      return;
    }
    if (source === 'body') {
      req.body = result.data;
    } else {
      // query/params read-only → lưu vào req.validated
      req.validated = { ...(req.validated || {}), ...result.data as Record<string, unknown> };
    }
    next();
  };
}
