import { getStorageRegistry, StorageProvider } from '../../services/storage-registry.service';
import { IStorageService } from '../../services/storage.interface';

describe('StorageRegistry', () => {
  let registry: ReturnType<typeof getStorageRegistry>;

  beforeEach(() => {
    registry = getStorageRegistry();
    registry.clear();
  });

  afterEach(() => {
    registry.clear();
  });

  const createMockProvider = (
    name: string,
    priority: number,
    shouldUse: boolean = true,
  ): StorageProvider => {
    const mockService: IStorageService = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
      fileExists: jest.fn(),
      getFile: jest.fn(),
      getFileStream: jest.fn(),
      isAvailable: jest.fn(),
    };

    return {
      name,
      priority,
      shouldUse: () => shouldUse,
      create: () => mockService,
    };
  };

  describe('register', () => {
    it('должен регистрировать провайдер', () => {
      const provider = createMockProvider('test', 50);
      registry.register(provider);

      expect(registry.getProvider('test')).toBe(provider);
    });

    it('должен заменять провайдер с тем же именем', () => {
      const provider1 = createMockProvider('test', 50);
      const provider2 = createMockProvider('test', 100);

      registry.register(provider1);
      registry.register(provider2);

      expect(registry.getProvider('test')).toBe(provider2);
      expect(registry.getAvailableProviders().length).toBe(1);
    });

    it('должен сортировать провайдеры по приоритету', () => {
      const provider1 = createMockProvider('low', 10);
      const provider2 = createMockProvider('high', 100);
      const provider3 = createMockProvider('medium', 50);

      registry.register(provider1);
      registry.register(provider2);
      registry.register(provider3);

      const providers = registry.getAvailableProviders();
      expect(providers[0].name).toBe('high');
      expect(providers[1].name).toBe('medium');
      expect(providers[2].name).toBe('low');
    });
  });

  describe('getAvailableProviders', () => {
    it('должен возвращать только провайдеры с shouldUse() === true', () => {
      const provider1 = createMockProvider('enabled', 50, true);
      const provider2 = createMockProvider('disabled', 40, false);
      const provider3 = createMockProvider('enabled2', 30, true);

      registry.register(provider1);
      registry.register(provider2);
      registry.register(provider3);

      const providers = registry.getAvailableProviders();
      expect(providers.length).toBe(2);
      expect(providers.map((p) => p.name)).toEqual(['enabled', 'enabled2']);
    });

    it('должен возвращать пустой массив если нет доступных провайдеров', () => {
      const provider = createMockProvider('disabled', 50, false);
      registry.register(provider);

      expect(registry.getAvailableProviders().length).toBe(0);
    });
  });

  describe('getProvider', () => {
    it('должен возвращать провайдер по имени', () => {
      const provider = createMockProvider('test', 50);
      registry.register(provider);

      expect(registry.getProvider('test')).toBe(provider);
    });

    it('должен возвращать undefined для несуществующего провайдера', () => {
      expect(registry.getProvider('nonexistent')).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('должен очищать реестр', () => {
      registry.register(createMockProvider('test1', 50));
      registry.register(createMockProvider('test2', 40));

      registry.clear();

      expect(registry.getAvailableProviders().length).toBe(0);
      expect(registry.getProvider('test1')).toBeUndefined();
    });
  });
});

