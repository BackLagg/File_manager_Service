import { IStorageService } from '../../services/storage.interface';

// Мокаем logger ПЕРЕД импортом модуля, так как logger создается на уровне модуля
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  getLogger: jest.fn(),
};

jest.mock('../../services/logger.service', () => ({
  getLogger: jest.fn(() => mockLogger),
}));

jest.mock('../../services/storage-manager.service');

import { StorageInitializerService } from '../../services/storage-initializer.service';
import { getStorageManager } from '../../services/storage-manager.service';

describe('StorageInitializerService', () => {
  let mockStorageService: jest.Mocked<IStorageService>;
  let mockStorageManager: jest.Mocked<ReturnType<typeof getStorageManager>>;

  beforeEach(() => {
    // Очищаем все моки
    jest.clearAllMocks();

    // Создаем мок для storage service
    mockStorageService = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
      fileExists: jest.fn(),
      getFile: jest.fn(),
      getFileStream: jest.fn(),
      isAvailable: jest.fn(),
    };

    // Создаем мок для storage manager
    mockStorageManager = {
      getStorageService: jest.fn().mockResolvedValue(mockStorageService),
      getStorageType: jest.fn(),
      isUsingStorageType: jest.fn(),
      reinitialize: jest.fn(),
    } as unknown as jest.Mocked<ReturnType<typeof getStorageManager>>;

    // Настраиваем моки
    (getStorageManager as jest.Mock).mockReturnValue(mockStorageManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('должен успешно инициализировать хранилище когда оно доступно', async () => {
      mockStorageService.isAvailable.mockResolvedValue(true);

      await expect(StorageInitializerService.initialize()).resolves.not.toThrow();

      expect(mockStorageManager.getStorageService).toHaveBeenCalledTimes(1);
      expect(mockStorageService.isAvailable).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Storage service initialized successfully');
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('должен выбрасывать ошибку когда хранилище недоступно', async () => {
      mockStorageService.isAvailable.mockResolvedValue(false);

      await expect(StorageInitializerService.initialize()).rejects.toThrow(
        'Storage service is not available',
      );

      expect(mockStorageManager.getStorageService).toHaveBeenCalledTimes(1);
      expect(mockStorageService.isAvailable).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith('Storage service is not available');
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('должен обрабатывать ошибку при получении storage service', async () => {
      const error = new Error('Storage service not initialized');
      mockStorageManager.getStorageService.mockRejectedValue(error);

      await expect(StorageInitializerService.initialize()).rejects.toThrow(
        'Storage service not initialized',
      );

      expect(mockStorageManager.getStorageService).toHaveBeenCalledTimes(1);
      expect(mockStorageService.isAvailable).not.toHaveBeenCalled();
    });

    it('должен обрабатывать ошибку при проверке доступности', async () => {
      const error = new Error('Network error');
      mockStorageService.isAvailable.mockRejectedValue(error);

      await expect(StorageInitializerService.initialize()).rejects.toThrow('Network error');

      expect(mockStorageManager.getStorageService).toHaveBeenCalledTimes(1);
      expect(mockStorageService.isAvailable).toHaveBeenCalledTimes(1);
    });
  });
});
