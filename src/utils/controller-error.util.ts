import { Response } from 'express';
import { getLogger } from '../services/logger.service';
import { config } from '../config';

const logger = getLogger();

/**
 * Утилиты для обработки ошибок в контроллерах
 */
export class ControllerErrorUtil {
  /**
   * Обрабатывает ошибку и отправляет ответ клиенту
   * @param error - Ошибка
   * @param res - Express Response объект
   * @param context - Контекст для логирования (например, 'uploading file', 'deleting file')
   * @param contextData - Дополнительные данные для логирования
   */
  static handleError(
    error: unknown,
    res: Response,
    context: string,
    contextData?: Record<string, unknown>,
  ): void {
    logger.error(`Error ${context}`, error, contextData);

    const message = error instanceof Error ? error.message : 'Unknown error';
    const errorMessage = config.server.nodeEnv === 'development' ? message : `Failed to ${context}`;

    res.status(500).json({
      error: errorMessage,
      message: config.server.nodeEnv === 'development' ? message : undefined,
    });
  }
}
