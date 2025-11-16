import { config } from '../config';

/**
 * Утилиты для работы с URL
 */
export class UrlUtil {
  /**
   * Формирует URL для файла в S3 хранилище
   */
  static buildS3Url(key: string, bucketName: string, region: string): string {
    // Приоритет: CDN URL > кастомный endpoint > стандартный S3 URL
    if (config.s3.cdnUrl) {
      // Используем CloudFront или другой CDN
      return `${config.s3.cdnUrl}/${key}`;
    } else if (config.s3.endpoint) {
      // Кастомный S3-совместимый endpoint (например, MinIO, DigitalOcean Spaces)
      const endpointUrl = config.s3.endpoint.replace(/\/$/, ''); // Убираем trailing slash
      return `${endpointUrl}/${bucketName}/${key}`;
    } else {
      // Стандартный AWS S3 URL
      return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    }
  }

  /**
   * Формирует URL для локального файла
   */
  static buildLocalUrl(folder: string, filename: string): string {
    return `/files/${folder}/${filename}`;
  }
}
