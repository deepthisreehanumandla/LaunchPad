import { Response } from 'express';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SendSuccessOptions<T> {
  res: Response;
  statusCode?: number;
  data: T;
  pagination?: Pagination;
}

export function sendSuccess<T>({ res, statusCode = 200, data, pagination }: SendSuccessOptions<T>): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(pagination ? { meta: { pagination } } : {}),
  });
}
