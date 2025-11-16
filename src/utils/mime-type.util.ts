import { extname } from 'path';
import { config } from '../config';

/**
 * Утилиты для работы с MIME типами
 */
export class MimeTypeUtil {
  private static readonly mimeTypes: { [key: string]: string } = {
    // Изображения
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.ico': 'image/x-icon',
    // Документы
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Текстовые файлы
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.xml': 'application/xml',
    // Архивы
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
  };

  private static readonly mimeToExt: { [key: string]: string[] } = {
    // Изображения
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/svg+xml': ['svg'],
    'image/svg': ['svg'],
    'image/webp': ['webp'],
    'image/bmp': ['bmp'],
    'image/tiff': ['tiff', 'tif'],
    'image/x-icon': ['ico'],
    'image/vnd.microsoft.icon': ['ico'],
    // Документы
    'application/pdf': ['pdf'],
    'application/msword': ['doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
    'application/vnd.ms-excel': ['xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
    // Текстовые файлы
    'text/plain': ['txt'],
    'text/csv': ['csv'],
    'application/json': ['json'],
    'application/xml': ['xml'],
    'text/xml': ['xml'],
    // Архивы
    'application/zip': ['zip'],
    'application/x-rar-compressed': ['rar'],
    'application/x-7z-compressed': ['7z'],
  };

  /**
   * Получает MIME тип по расширению
   */
  static getMimeType(filename: string): string {
    const ext = extname(filename).toLowerCase();
    return this.mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Проверяет MIME тип
   */
  static isMimeTypeAllowed(mimetype: string): boolean {
    // Проверяем точное совпадение MIME-типа
    const allowedExts = this.mimeToExt[mimetype.toLowerCase()];
    if (allowedExts) {
      return allowedExts.some((ext) => config.storage.allowedExtensions.includes(ext));
    }

    // Если MIME-тип не найден в маппинге, пробуем извлечь расширение из типа
    // Например, image/jpeg -> jpeg
    const mimePart = mimetype.toLowerCase().split('/')[1];
    if (mimePart) {
      // Убираем возможные суффиксы типа +xml, +json и т.д.
      const cleanExt = mimePart.split('+')[0].split(';')[0];
      return config.storage.allowedExtensions.includes(cleanExt);
    }

    return false;
  }
}
