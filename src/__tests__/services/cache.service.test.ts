import { CacheService } from '../../services/cache.service';

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = new CacheService(1000); // 1 секунда для тестов
  });

  afterEach(() => {
    cache.clear();
  });

  describe('get и set', () => {
    it('должен сохранять и получать значения', () => {
      cache.set('key1', 'value1');
      expect(cache.get<string>('key1')).toBe('value1');
    });

    it('должен возвращать null для несуществующих ключей', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('должен поддерживать разные типы данных', () => {
      cache.set('string', 'test');
      cache.set('number', 123);
      cache.set('boolean', true);
      cache.set('object', { key: 'value' });

      expect(cache.get<string>('string')).toBe('test');
      expect(cache.get<number>('number')).toBe(123);
      expect(cache.get<boolean>('boolean')).toBe(true);
      expect(cache.get<{ key: string }>('object')).toEqual({ key: 'value' });
    });
  });

  describe('TTL', () => {
    it('должен удалять значения после истечения TTL', async () => {
      cache.set('key', 'value', 100); // 100ms

      expect(cache.get('key')).toBe('value');

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(cache.get('key')).toBeNull();
    });

    it('должен использовать кастомный TTL', async () => {
      cache.set('key1', 'value1', 200);
      cache.set('key2', 'value2', 50);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('delete', () => {
    it('должен удалять значения', () => {
      cache.set('key', 'value');
      cache.delete('key');
      expect(cache.get('key')).toBeNull();
    });

    it('должен не падать при удалении несуществующего ключа', () => {
      expect(() => cache.delete('nonexistent')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('должен очищать весь кэш', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.size()).toBe(0);
    });
  });

  describe('has', () => {
    it('должен возвращать true для существующих ключей', () => {
      cache.set('key', 'value');
      expect(cache.has('key')).toBe(true);
    });

    it('должен возвращать false для несуществующих ключей', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('должен возвращать false для истекших ключей', async () => {
      cache.set('key', 'value', 50);
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(cache.has('key')).toBe(false);
    });
  });

  describe('getOrSet', () => {
    it('должен возвращать кэшированное значение', async () => {
      cache.set('key', 'cached');
      const result = await cache.getOrSet('key', async () => 'new');
      expect(result).toBe('cached');
    });

    it('должен выполнять factory и кэшировать результат', async () => {
      const factory = jest.fn(async () => 'new-value');
      const result1 = await cache.getOrSet('key', factory);
      const result2 = await cache.getOrSet('key', factory);

      expect(factory).toHaveBeenCalledTimes(1);
      expect(result1).toBe('new-value');
      expect(result2).toBe('new-value');
    });

    it('должен использовать кастомный TTL', async () => {
      const factory = jest.fn(async () => 'value');
      await cache.getOrSet('key', factory, 50);

      await new Promise((resolve) => setTimeout(resolve, 100));

      await cache.getOrSet('key', factory);
      expect(factory).toHaveBeenCalledTimes(2);
    });
  });

  describe('cleanup', () => {
    it('должен удалять истекшие записи', async () => {
      cache.set('key1', 'value1', 50);
      cache.set('key2', 'value2', 200);

      await new Promise((resolve) => setTimeout(resolve, 100));

      cache.cleanup();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });
  });

  describe('size', () => {
    it('должен возвращать количество записей', () => {
      expect(cache.size()).toBe(0);
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
      cache.delete('key1');
      expect(cache.size()).toBe(1);
    });
  });
});

