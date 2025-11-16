import pino from 'pino';
import { config } from '../config';

/**
 * Сервис структурированного логирования
 */
class LoggerService {
  private logger: pino.Logger;

  constructor() {
    const isDevelopment = config.server.nodeEnv === 'development';

    this.logger = pino({
      level: isDevelopment ? 'debug' : 'info',
      transport: isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
      formatters: {
        level: (label) => {
          return { level: label.toUpperCase() };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }

  /**
   * Логирование информационных сообщений
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.logger.info(context || {}, message);
  }

  /**
   * Логирование предупреждений
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(context || {}, message);
  }

  /**
   * Логирование ошибок
   */
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    const errorContext: Record<string, unknown> = {
      ...context,
    };

    if (error instanceof Error) {
      errorContext.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    } else if (error) {
      errorContext.error = error;
    }

    this.logger.error(errorContext, message);
  }

  /**
   * Логирование отладочных сообщений
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.logger.debug(context || {}, message);
  }

  /**
   * Получение экземпляра pino logger для расширенного использования
   */
  getLogger(): pino.Logger {
    return this.logger;
  }
}

// Singleton instance
let loggerInstance: LoggerService | null = null;

/**
 * Получает экземпляр сервиса логирования
 */
export function getLogger(): LoggerService {
  if (!loggerInstance) {
    loggerInstance = new LoggerService();
  }
  return loggerInstance;
}
