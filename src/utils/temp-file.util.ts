import { promises as fsPromises } from 'fs';
import { getLogger } from '../services/logger.service';

const logger = getLogger();

/**
 * Утилиты для работы с временными файлами
 */
export class TempFileUtil {
  /**
   * Безопасно удаляет временный файл, игнорируя ошибки
   * @param filePath - Путь к временному файлу
   * @param context - Контекст для логирования (например, 'after upload', 'after validation error')
   */
  static async safeUnlink(filePath: string, context?: string): Promise<void> {
    if (!filePath) {
      return;
    }

    try {
      await fsPromises.unlink(filePath);
    } catch (error) {
      logger.warn(`Failed to delete temp file ${context || ''}`, {
        error,
        filePath,
      });
    }
  }
}
