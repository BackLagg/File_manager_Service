import { IStorageService } from './storage.interface';
import { getLogger } from './logger.service';
import { getStorageRegistry } from './storage-registry.service';

export class StorageManagerService {
  private storageService: IStorageService | null = null;
  private currentStorageType: string | null = null;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initializationPromise = this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    const logger = getLogger();
    const registry = getStorageRegistry();
    const providers = registry.getAvailableProviders();

    if (providers.length === 0) {
      throw new Error('No storage providers available');
    }

    // Пробуем хранилища в порядке приоритета
    for (const provider of providers) {
      try {
        const service = provider.create();
        const available = await service.isAvailable();

        if (available) {
          this.storageService = service;
          this.currentStorageType = provider.name;
          logger.info(`Storage provider "${provider.name}" is available and will be used`, {
            provider: provider.name,
            priority: provider.priority,
          });
          return;
        } else {
          logger.debug(`Storage provider "${provider.name}" is not available, trying next`, {
            provider: provider.name,
          });
        }
      } catch (error) {
        logger.warn(`Error checking storage provider "${provider.name}"`, {
          provider: provider.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Если ни одно хранилище не доступно
    throw new Error(
      `No available storage providers. Tried: ${providers.map((p) => p.name).join(', ')}`,
    );
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
   * Получает тип текущего хранилища
   */
  getStorageType(): string | null {
    return this.currentStorageType;
  }

  /**
   * Проверяет, используется ли конкретный тип хранилища
   */
  isUsingStorageType(type: string): boolean {
    return this.currentStorageType === type;
  }

  /**
   * Переинициализирует хранилище (полезно при изменении конфигурации)
   */
  async reinitialize(): Promise<void> {
    this.storageService = null;
    this.currentStorageType = null;
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
