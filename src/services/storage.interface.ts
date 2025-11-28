import { Readable } from 'stream';

export interface FileUploadResult {
  success: boolean;
  filename: string;
  path: string;
  url: string;
  size: number;
}

export interface FileDeleteResult {
  success: boolean;
  message?: string;
}

export interface FileExistsResult {
  exists: boolean;
}

export interface IStorageService {
  /**
   * Загружает файл
   * @param source - Buffer с содержимым файла или путь к файлу на диске
   * @param filename - Имя файла
   * @param folder - Папка для сохранения
   * @param mimetype - MIME тип файла
   */
  uploadFile(
    source: Buffer | string,
    filename: string,
    folder: string,
    mimetype?: string,
  ): Promise<FileUploadResult>;

  /**
   * Удаляет файл
   */
  deleteFile(path: string): Promise<FileDeleteResult>;

  /**
   * Проверяет существование файла
   */
  fileExists(path: string): Promise<FileExistsResult>;

  /**
   * Получает файл как Buffer (для обратной совместимости)
   */
  getFile(path: string): Promise<Buffer | null>;

  /**
   * Получает файл как поток (stream) для эффективной передачи больших файлов
   * @returns Readable stream или null если файл не найден
   */
  getFileStream(path: string): Promise<Readable | null>;

  /**
   * Проверяет доступность хранилища
   */
  isAvailable(): Promise<boolean>;
}
