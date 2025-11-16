import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import { config } from '../config';

export interface AuthenticatedRequest extends Request {
  apiKey?: string;
}

/**
 * Безопасное сравнение строк для защиты от timing attacks
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  // Преобразуем строки в Buffer для использования timingSafeEqual
  const aBuffer = Buffer.from(a, 'utf8');
  const bBuffer = Buffer.from(b, 'utf8');

  try {
    return timingSafeEqual(aBuffer, bBuffer);
  } catch {
    // Если произошла ошибка, возвращаем false
    return false;
  }
}

export function apiKeyAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({ error: 'API key is required' });
    return;
  }

  // Используем безопасное сравнение для защиты от timing attacks
  if (!safeCompare(apiKey, config.server.apiKey)) {
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  req.apiKey = apiKey;
  next();
}
