import rateLimit from 'express-rate-limit';

/** Limite geral da API. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Limite mais agressivo para rotas de autenticação (anti brute-force). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
});

/** Limite para rotas que chamam a IA (controle de custo). */
export const iaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de uso da IA atingido nesta hora. Tente mais tarde.' },
});
