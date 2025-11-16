import { stat } from 'fs/promises';

/**
 * Утилиты для работы с размером файлов
 */
export class FileSizeUtil {
  /**
   * Определяет размер файла из Buffer или пути к файлу
   */
  static async getFileSize(source: Buffer | string): Promise<number> {
    if (typeof source === 'string') {
      const stats = await stat(source);
      return stats.size;
    } else {
      return source.length;
    }
  }
}
