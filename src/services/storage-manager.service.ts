import { IStorageService } from './storage.interface';
import { S3StorageService } from './s3-storage.service';
import { LocalStorageService } from './local-storage.service';
import { config } from '../config';
import { getLogger } from './logger.service';

export class StorageManagerService {
  private storageService: IStorageService | null = null;
  private isS3Available: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Инициализация будет выполнена асинхронно
    this.initializationPromise = this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    const logger = getLogger();
    // Инициализируем сервисы
    const s3Service = new S3StorageService();
    const localService = new LocalStorageService();

    if (config.s3.enabled) {
      try {
        const available = await s3Service.isAvailable();
        if (available) {
          this.storageService = s3Service;
          this.isS3Available = true;
          logger.info('S3 storage is available and will be used', {
            bucket: config.s3.bucketName,
            region: config.s3.region,
          });
          return;
        }
      } catch (error) {
        logger.warn('S3 is not available, falling back to local storage', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Фолбэк на локальное хранилище
    this.storageService = localService;
    this.isS3Available = false;
    logger.info('Using local storage service', {
      path: config.storage.path,
    });
  }

  /**
   * Получает текущий сервис хранилища
   * Ожидает завершения инициализации если она еще не завершена
   */
  async getStorageService(): Promise<IStorageService> {
    if (this.initializationPromise) {
      await this.initializationPromise;
      this.initializationPromise = null;
    }

    if (!this.storageService) {
      throw new Error('Storage service not initialized');
    }

    return this.storageService;
  }

  /**
   * Проверяет, используется ли S3
   */
  isUsingS3(): boolean {
    return this.isS3Available;
  }

  /**
   * Переинициализирует хранилище (полезно при изменении конфигурации)
   */
  async reinitialize(): Promise<void> {
    this.storageService = null;
    this.isS3Available = false;
    this.initializationPromise = this.initializeStorage();
    await this.initializationPromise;
    this.initializationPromise = null;
  }
}

// Singleton instance
let storageManagerInstance: StorageManagerService | null = null;

export function getStorageManager(): StorageManagerService {
  if (!storageManagerInstance) {
    storageManagerInstance = new StorageManagerService();
  }
  return storageManagerInstance;
}
