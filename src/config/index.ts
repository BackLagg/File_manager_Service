import * as dotenv from 'dotenv';
import * as path from 'path';

// Ищем .env в корне проекта (на уровень выше file-service)
// process.cwd() в dev режиме будет file-service, в production - может быть другой
const projectRoot = path.resolve(process.cwd(), '..');
const rootEnvPath = path.join(projectRoot, '.env');
const localEnvPath = path.join(process.cwd(), '.env');

// Пробуем загрузить из корня проекта, затем из текущей директории
dotenv.config({ path: rootEnvPath });
dotenv.config({ path: localEnvPath });

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3002', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiKey: process.env.FILE_API_KEY || '',
    // Rate limiting configuration
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes default
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per window
    },
    // Body parser limits
    bodyParser: {
      jsonLimit: process.env.BODY_JSON_LIMIT || '50mb',
      urlencodedLimit: process.env.BODY_URLENCODED_LIMIT || '50mb',
    },
    // CORS configuration
    cors: {
      origin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? false : true),
      // Если CORS_ORIGIN задан, парсим как массив или строку
      getOrigins(): string | boolean | string[] {
        const origin = this.origin;
        if (origin === false || origin === true) {
          return origin;
        }
        // Проверяем, что это строка
        if (typeof origin === 'string') {
          // Если это строка с несколькими origins через запятую
          if (origin.includes(',')) {
            return origin.split(',').map((o) => o.trim());
          }
          return origin;
        }
        // Fallback на true для development
        return true;
      },
    },
    // HTTPS enforcement
    enforceHttps: process.env.ENFORCE_HTTPS === 'true',
  },
  s3: {
    enabled: process.env.S3_ENABLED === 'true',
    region: process.env.S3_REGION || 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    bucketName: process.env.S3_BUCKET_NAME || '',
    endpoint: process.env.S3_ENDPOINT,
    // CloudFront CDN URL (опционально, если используется CDN)
    cdnUrl: process.env.S3_CDN_URL || '',
  },
  storage: {
    path: process.env.STORAGE_PATH || './storage',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10), // 50MB default
    allowedExtensions: (
      process.env.ALLOWED_EXTENSIONS ||
      'jpg,jpeg,png,gif,svg,webp,bmp,tiff,tif,ico,pdf,doc,docx,xls,xlsx,txt,csv,json,xml,zip,rar,7z'
    )
      .split(',')
      .map((ext) => ext.trim()),
  },
};

/**
 * Валидирует конфигурацию приложения
 * @throws {Error} Если конфигурация невалидна
 */
export function validateConfig(): void {
  const errors: string[] = [];

  // Проверка обязательных параметров сервера
  // В development режиме FILE_API_KEY не обязателен
  if (!config.server.apiKey && config.server.nodeEnv !== 'development') {
    errors.push('FILE_API_KEY is required');
  }

  // Проверка валидности порта
  if (isNaN(config.server.port) || config.server.port < 1 || config.server.port > 65535) {
    errors.push(`PORT must be a valid number between 1 and 65535, got: ${config.server.port}`);
  }

  // Проверка валидности maxFileSize
  if (isNaN(config.storage.maxFileSize) || config.storage.maxFileSize <= 0) {
    errors.push(`MAX_FILE_SIZE must be a positive number, got: ${config.storage.maxFileSize}`);
  }

  // Проверка S3 конфигурации, если S3 включен
  if (config.s3.enabled) {
    if (!config.s3.bucketName) {
      errors.push('S3_BUCKET_NAME is required when S3_ENABLED=true');
    }
    if (!config.s3.accessKeyId) {
      errors.push('S3_ACCESS_KEY_ID is required when S3_ENABLED=true');
    }
    if (!config.s3.secretAccessKey) {
      errors.push('S3_SECRET_ACCESS_KEY is required when S3_ENABLED=true');
    }
    if (!config.s3.region) {
      errors.push('S3_REGION is required when S3_ENABLED=true');
    }
  }

  // Проверка allowedExtensions
  if (config.storage.allowedExtensions.length === 0) {
    errors.push('ALLOWED_EXTENSIONS must contain at least one extension');
  }

  if (errors.length > 0) {
    throw new Error(
      `Configuration validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }
}
