import { getStorageManager } from './storage-manager.service';
import { getLogger } from './logger.service';

const logger = getLogger();

/**
 * Сервис для инициализации хранилища
 */
export class StorageInitializerService {
  /**
   * Инициализирует хранилище и проверяет его доступность
   * @throws {Error} Если хранилище недоступно
   */
  static async initialize(): Promise<void> {
    const storageManager = getStorageManager();
    const storageService = await storageManager.getStorageService();
    const available = await storageService.isAvailable();

    if (!available) {
      logger.error('Storage service is not available');
      throw new Error('Storage service is not available');
    }

    logger.info('Storage service initialized successfully');
  }
}
