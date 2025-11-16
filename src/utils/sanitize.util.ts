/**
 * Утилиты для санитизации и валидации входных данных
 */

export class SanitizeUtil {
  /**
   * Санитизирует имя папки, оставляя только безопасные символы
   * Разрешает только буквы, цифры, дефисы и подчеркивания
   */
  static sanitizeFolderName(name: string): string {
    if (!name || typeof name !== 'string') {
      return 'default';
    }
    const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
    return sanitized || 'default';
  }

  /**
   * Санитизирует префикс имени файла
   * Разрешает только буквы, цифры, дефисы и подчеркивания
   */
  static sanitizePrefix(prefix: string): string {
    if (!prefix || typeof prefix !== 'string') {
      return 'file';
    }
    const sanitized = prefix.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
    return sanitized || 'file';
  }

  /**
   * Санитизирует имя файла
   * Удаляет опасные символы, но сохраняет расширение
   */
  static sanitizeFileName(filename: string): string {
    if (!filename || typeof filename !== 'string') {
      return 'file';
    }
    return filename.replace(/[^a-zA-Z0-9._-]/g, '').substring(0, 255);
  }
}
