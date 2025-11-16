/**
 * Утилиты для обработки ошибок S3
 */
export class S3ErrorUtil {
  /**
   * Проверяет, является ли ошибка S3 ошибкой 404 (файл не найден)
   * @param error - Ошибка от S3 клиента
   * @returns true если это ошибка 404, false в противном случае
   */
  static isNotFoundError(error: unknown): boolean {
    return (
      error !== null &&
      typeof error === 'object' &&
      '$metadata' in error &&
      error.$metadata !== null &&
      typeof error.$metadata === 'object' &&
      'httpStatusCode' in error.$metadata &&
      error.$metadata.httpStatusCode === 404
    );
  }
}
