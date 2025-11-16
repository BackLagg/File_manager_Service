import { promises as fsPromises } from 'fs';
import { extname } from 'path';
import { fileTypeFromBuffer } from 'file-type';
import { config } from '../config';
import { getLogger } from '../services/logger.service';
import { PathUtil } from './path.util';
import { MimeTypeUtil } from './mime-type.util';

const logger = getLogger();

export interface FileInfo {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
}

export class FileUtil {
  /**
   * Создает директорию если её нет (асинхронная версия)
   */
  static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fsPromises.access(dirPath);
    } catch {
      try {
        await fsPromises.mkdir(dirPath, { recursive: true });
      } catch (mkdirError) {
        logger.error('Error creating directory', mkdirError, { dirPath });
        throw mkdirError;
      }
    }
  }

  /**
   * Генерирует уникальное имя файла
   */
  static generateUniqueFilename(originalName: string, prefix: string = 'file'): string {
    const ext = extname(originalName);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    return `${prefix}-${uniqueSuffix}${ext}`;
  }

  /**
   * Проверяет расширение файла
   */
  static isExtensionAllowed(filename: string): boolean {
    const ext = extname(filename).toLowerCase().substring(1);
    return config.storage.allowedExtensions.includes(ext);
  }

  /**
   * Проверяет размер файла
   */
  static isSizeValid(size: number): boolean {
    return size <= config.storage.maxFileSize;
  }

  /**
   * Проверяет тип файла по содержимому (magic numbers)
   * Возвращает true если тип файла соответствует содержимому
   * @param source - Buffer с содержимым файла или путь к файлу на диске
   * @param expectedMimeType - Ожидаемый MIME тип
   */
  static async validateFileContent(
    source: Buffer | string,
    expectedMimeType: string,
  ): Promise<boolean> {
    try {
      let buffer: Buffer;

      // Если передан путь к файлу, читаем только первые байты для проверки magic numbers
      if (typeof source === 'string') {
        // Читаем только первые 4100 байт (достаточно для определения типа)
        const fileHandle = await fsPromises.open(source, 'r');
        const readBuffer = Buffer.alloc(4100);
        const { bytesRead } = await fileHandle.read(readBuffer, 0, 4100, 0);
        await fileHandle.close();
        buffer = readBuffer.slice(0, bytesRead);
      } else {
        buffer = source;
      }

      // Проверяем magic numbers (первые байты файла)
      const detectedType = await fileTypeFromBuffer(buffer);

      if (!detectedType) {
        // Если не удалось определить тип, проверяем по расширению
        // Это может быть текстовый файл или другой тип без magic numbers
        logger.debug('File type could not be detected from content, using extension validation');
        return MimeTypeUtil.isMimeTypeAllowed(expectedMimeType);
      }

      // Проверяем, что обнаруженный тип соответствует ожидаемому
      const detectedMime = detectedType.mime.toLowerCase();
      const expectedMime = expectedMimeType.toLowerCase();

      // Прямое совпадение
      if (detectedMime === expectedMime) {
        return true;
      }

      // Проверяем совместимые типы (например, image/jpeg и image/jpg)
      const compatibleTypes: { [key: string]: string[] } = {
        'image/jpeg': ['image/jpg'],
        'image/jpg': ['image/jpeg'],
        'text/plain': ['text/plain'],
        'application/json': ['text/json'],
      };

      if (compatibleTypes[detectedMime]?.includes(expectedMime)) {
        return true;
      }

      // Проверяем, что обнаруженный тип разрешен
      if (!MimeTypeUtil.isMimeTypeAllowed(detectedMime)) {
        logger.warn('File content type does not match expected type', {
          detected: detectedMime,
          expected: expectedMime,
        });
        return false;
      }

      // Если обнаруженный тип разрешен, но не совпадает с ожидаемым - предупреждение
      logger.warn('File content type differs from declared type', {
        detected: detectedMime,
        expected: expectedMime,
      });

      // Разрешаем, если обнаруженный тип тоже в списке разрешенных
      return true;
    } catch (error) {
      logger.error('Error validating file content', error);
      // В случае ошибки проверки содержимого, полагаемся на проверку MIME типа
      return MimeTypeUtil.isMimeTypeAllowed(expectedMimeType);
    }
  }

  /**
   * Проверяет MIME тип
   */
  static isMimeTypeAllowed(mimetype: string): boolean {
    return MimeTypeUtil.isMimeTypeAllowed(mimetype);
  }

  /**
   * Удаляет файл (асинхронная версия)
   */
  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      await fsPromises.unlink(filePath);
      return true;
    } catch (error) {
      // Если файл не существует, считаем успешным
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return true;
      }
      logger.error('Error deleting file', error, { filePath });
      return false;
    }
  }

  /**
   * Проверяет существование файла (асинхронная версия)
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fsPromises.access(filePath);
      return true;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') {
        logger.warn('Error checking file existence', { filePath, code: err.code });
      }
      return false;
    }
  }

  /**
   * Получает MIME тип по расширению
   */
  static getMimeType(filename: string): string {
    return MimeTypeUtil.getMimeType(filename);
  }

  /**
   * Нормализует путь, защита от path traversal
   * Удаляет все попытки выхода за пределы текущей директории
   */
  static normalizePath(filePath: string): string {
    return PathUtil.normalizePath(filePath);
  }

  /**
   * Извлекает относительный путь из полного URL или пути
   * Защита от path traversal
   */
  static extractRelativePath(filePath: string): string {
    return PathUtil.extractRelativePath(filePath);
  }
}
