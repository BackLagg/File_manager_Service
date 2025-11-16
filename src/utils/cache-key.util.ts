/**
 * Утилиты для генерации ключей кэша
 */
export class CacheKeyUtil {
  /**
   * Генерирует ключ кэша для проверки существования файла в локальном хранилище
   */
  static forLocalFileExists(relativePath: string): string {
    return `local:exists:${relativePath}`;
  }

  /**
   * Генерирует ключ кэша для проверки существования файла в S3
   */
  static forS3FileExists(bucketName: string, key: string): string {
    return `s3:exists:${bucketName}:${key}`;
  }

  /**
   * Генерирует ключ кэша для проверки доступности S3
   */
  static forS3Availability(bucketName: string): string {
    return `s3:available:${bucketName}`;
  }
}
