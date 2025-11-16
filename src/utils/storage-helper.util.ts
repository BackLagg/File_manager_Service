import { IStorageService } from '../services/storage.interface';
import { getStorageManager } from '../services/storage-manager.service';

/**
 * Утилиты для работы с хранилищем в контроллерах
 */
export class StorageHelper {
  /**
   * Получает текущий сервис хранилища
   */
  static async getStorageService(): Promise<IStorageService> {
    const storageManager = getStorageManager();
    return await storageManager.getStorageService();
  }
}
