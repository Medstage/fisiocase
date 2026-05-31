import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodType } from 'zod';

/** Valida `req.body` contra um schema Zod. Em caso de erro, retorna 400 com as issues. */
export const validate =
  (schema: ZodType): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Dados inválidos',
        issues: result.error.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
