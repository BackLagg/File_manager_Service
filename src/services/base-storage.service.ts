import { IStorageService, FileDeleteResult, FileExistsResult } from './storage.interface';
import { PathUtil } from '../utils/path.util';
import { getCacheService } from './cache.service';
import { getLogger } from './logger.service';

const logger = getLogger();

/**
 * Базовый класс для сервисов хранилища с общей логикой
 */
export abstract class BaseStorageService implements IStorageService {
  protected readonly cache = getCacheService();

  /**
   * Извлекает и валидирует относительный путь
   */
  protected extractAndValidatePath(filePath: string): string | null {
    const relativePath = PathUtil.extractRelativePath(filePath);
    if (!PathUtil.isValidPath(relativePath)) {
      return null;
    }
    return relativePath;
  }

  /**
   * Общая логика для проверки существования файла с кэшированием
   */
  protected async checkFileExistsWithCache(
    filePath: string,
    cacheKey: string,
    checkFn: (relativePath: string) => Promise<boolean>,
    positiveCacheTTL: number = 60 * 1000,
    negativeCacheTTL: number = 30 * 1000,
  ): Promise<FileExistsResult> {
    try {
      const relativePath = this.extractAndValidatePath(filePath);
      if (!relativePath) {
        return { exists: false };
      }

      // Проверяем кэш
      const cached = this.cache.get<boolean>(cacheKey);
      if (cached !== null) {
        return { exists: cached };
      }

      // Выполняем проверку
      const exists = await checkFn(relativePath);

      // Кэшируем результат
      const ttl = exists ? positiveCacheTTL : negativeCacheTTL;
      this.cache.set(cacheKey, exists, ttl);

      return { exists };
    } catch (error) {
      // При ошибке кэшируем отрицательный результат
      logger.error('Error checking file existence', error, { filePath, cacheKey });
      const relativePath = this.extractAndValidatePath(filePath);
      if (relativePath) {
        this.cache.set(cacheKey, false, negativeCacheTTL);
      }
      return { exists: false };
    }
  }

  /**
   * Общая логика для удаления файла с инвалидацией кэша
   */
  protected invalidateCache(cacheKey: string): void {
    this.cache.delete(cacheKey);
  }

  /**
   * Абстрактные методы, которые должны быть реализованы в дочерних классах
   */
  abstract uploadFile(
    source: Buffer | string,
    filename: string,
    folder: string,
    mimetype: string,
  ): Promise<import('./storage.interface').FileUploadResult>;

  abstract deleteFile(path: string): Promise<FileDeleteResult>;

  abstract fileExists(path: string): Promise<FileExistsResult>;

  abstract getFile(path: string): Promise<Buffer | null>;

  abstract getFileStream(path: string): Promise<import('stream').Readable | null>;

  abstract isAvailable(): Promise<boolean>;
}
