/**
 * In-memory кэш сервис для кэширования результатов операций
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class CacheService {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly defaultTTL: number; // Time to live в миллисекундах

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    // По умолчанию 5 минут
    this.defaultTTL = defaultTTL;
  }

  /**
   * Получает значение из кэша
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Проверяем, не истек ли срок действия
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Сохраняет значение в кэш
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Удаляет значение из кэша
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Очищает весь кэш
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Проверяет существование ключа в кэше
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Проверяем срок действия
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Получает значение из кэша или выполняет функцию и кэширует результат
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Очищает устаревшие записи из кэша
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Получает количество записей в кэше
   */
  size(): number {
    return this.cache.size;
  }
}

// Singleton instance
let cacheInstance: CacheService | null = null;

/**
 * Получает экземпляр кэш сервиса
 */
export function getCacheService(): CacheService {
  if (!cacheInstance) {
    // Для проверки существования файлов - 1 минута
    // Для проверки доступности S3 - 5 минут
    cacheInstance = new CacheService(5 * 60 * 1000);

    // Периодическая очистка устаревших записей каждые 10 минут
    setInterval(
      () => {
        cacheInstance?.cleanup();
      },
      10 * 60 * 1000,
    );
  }
  return cacheInstance;
}
