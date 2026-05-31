import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

interface AppError extends Error {
  status?: number;
}

/** Handler central de erros. Express 5 encaminha rejeições de promise para cá. */
export const errorHandler: ErrorRequestHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // eslint-disable-next-line no-console
  console.error('[erro]', err);
  const status = err.status ?? 500;
  res.status(status).json({
    error: err.message || 'Erro interno do servidor',
  });
};
