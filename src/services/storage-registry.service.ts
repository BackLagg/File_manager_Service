import { IStorageService } from './storage.interface';
import { getLogger } from './logger.service';

const logger = getLogger();

/**
 * Провайдер хранилища - фабрика для создания экземпляров хранилищ
 */
export interface StorageProvider {
  /**
   * Уникальное имя типа хранилища (например, 's3', 'local', 'azure')
   */
  name: string;

  /**
   * Приоритет хранилища (чем выше число, тем выше приоритет)
   * Хранилища проверяются в порядке убывания приоритета
   */
  priority: number;

  /**
   * Проверяет, должно ли это хранилище быть использовано
   * @returns true если хранилище должно быть проверено на доступность
   */
  shouldUse(): boolean;

  /**
   * Создает экземпляр хранилища
   */
  create(): IStorageService;
}

/**
 * Реестр хранилищ с поддержкой приоритетов
 */
class StorageRegistry {
  private providers: StorageProvider[] = [];

  /**
   * Регистрирует провайдер хранилища
   */
  register(provider: StorageProvider): void {
    // Удаляем существующий провайдер с таким же именем
    this.providers = this.providers.filter((p) => p.name !== provider.name);

    // Добавляем новый провайдер
    this.providers.push(provider);

    // Сортируем по приоритету (от большего к меньшему)
    this.providers.sort((a, b) => b.priority - a.priority);

    logger.debug('Storage provider registered', {
      name: provider.name,
      priority: provider.priority,
      totalProviders: this.providers.length,
    });
  }

  /**
   * Получает список провайдеров, отсортированных по приоритету
   * Возвращает только те, которые должны быть использованы (shouldUse() === true)
   */
  getAvailableProviders(): StorageProvider[] {
    return this.providers.filter((provider) => provider.shouldUse());
  }

  /**
   * Получает провайдер по имени
   */
  getProvider(name: string): StorageProvider | undefined {
    return this.providers.find((p) => p.name === name);
  }

  /**
   * Очищает реестр
   */
  clear(): void {
    this.providers = [];
  }
}

// Singleton instance
let registryInstance: StorageRegistry | null = null;

/**
 * Получает экземпляр реестра хранилищ
 */
export function getStorageRegistry(): StorageRegistry {
  if (!registryInstance) {
    registryInstance = new StorageRegistry();
  }
  return registryInstance;
}
