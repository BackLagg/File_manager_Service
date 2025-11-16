import * as path from 'path';

/**
 * Утилиты для работы с путями файлов
 */
export class PathUtil {
  /**
   * Нормализует путь, защита от path traversal
   * Удаляет все попытки выхода за пределы текущей директории
   */
  static normalizePath(filePath: string): string {
    // Нормализуем путь
    let normalized = path.normalize(filePath);

    // Удаляем все попытки path traversal (../, ..\, и т.д.)
    normalized = normalized.replace(/\.\./g, '');

    // Удаляем абсолютные пути (начинающиеся с / или C:\)
    if (path.isAbsolute(normalized)) {
      normalized = normalized.replace(/^[\/\\]|^[A-Za-z]:[\/\\]/, '');
    }

    // Удаляем ведущие слэши
    normalized = normalized.replace(/^[\/\\]+/, '');

    return normalized;
  }

  /**
   * Извлекает относительный путь из полного URL или пути
   * Защита от path traversal
   */
  static extractRelativePath(filePath: string): string {
    let relativePath: string;

    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      try {
        const urlObj = new URL(filePath);
        relativePath = urlObj.pathname.replace(/^\/files\//, '');
      } catch {
        relativePath = filePath;
      }
    } else if (filePath.startsWith('/files/')) {
      relativePath = filePath.replace(/^\/files\//, '');
    } else {
      relativePath = filePath;
    }

    // Нормализуем путь для защиты от path traversal
    return this.normalizePath(relativePath);
  }

  /**
   * Проверяет валидность пути (безопасен ли он)
   */
  static isValidPath(filePath: string): boolean {
    const normalized = this.extractRelativePath(filePath);
    return normalized.length > 0 && !normalized.includes('..');
  }
}
