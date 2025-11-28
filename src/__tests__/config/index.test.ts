const originalEnv = process.env;

describe('config', () => {
  beforeEach(() => {
    // Очищаем process.env перед каждым тестом
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Восстанавливаем оригинальные значения
    process.env = originalEnv;
  });

  describe('validateConfig', () => {
    it('должен проходить валидацию с корректной конфигурацией', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3002';
      process.env.MAX_FILE_SIZE = '52428800';
      process.env.ALLOWED_EXTENSIONS = 'jpg,png,pdf';
      process.env.FILE_API_KEY = 'test-key';

      // Перезагружаем модуль для применения новых env переменных
      jest.resetModules();
      const { validateConfig: validate } = require('../../config');

      expect(() => validate()).not.toThrow();
    });

    it('должен проходить валидацию в development режиме без API ключа', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3002';
      process.env.MAX_FILE_SIZE = '52428800';
      process.env.ALLOWED_EXTENSIONS = 'jpg,png';

      jest.resetModules();
      const { validateConfig: validate } = require('../../config');

      expect(() => validate()).not.toThrow();
    });

    it('должен выбрасывать ошибку если FILE_API_KEY отсутствует в production', () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '3002';
      process.env.MAX_FILE_SIZE = '52428800';
      process.env.ALLOWED_EXTENSIONS = 'jpg,png';
      delete process.env.FILE_API_KEY;

      jest.resetModules();
      const { validateConfig: validate } = require('../../config');

      expect(() => validate()).toThrow('FILE_API_KEY is required');
    });

    it('должен выбрасывать ошибку если PORT невалиден (меньше 1)', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '0';
      process.env.MAX_FILE_SIZE = '52428800';
      process.env.ALLOWED_EXTENSIONS = 'jpg,png';
      process.env.FILE_API_KEY = 'test-key';

      jest.resetModules();
      const { validateConfig: validate } = require('../../config');

      expect(() => validate()).toThrow('PORT must be a valid number between 1 and 65535');
    });

    it('должен выбрасывать ошибку если PORT невалиден (больше 65535)', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '65536';
      process.env.MAX_FILE_SIZE = '52428800';
      process.env.ALLOWED_EXTENSIONS = 'jpg,png';
      process.env.FILE_API_KEY = 'test-key';

      jest.resetModules();
      const { validateConfig: validate } = require('../../config');

      expect(() => validate()).toThrow('PORT must be a valid number between 1 and 65535');
    });

    it('должен выбрасывать ошибку если PORT не является числом', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = 'invalid';
      process.env.MAX_FILE_SIZE = '52428800';
      process.env.ALLOWED_EXTENSIONS = 'jpg,png';
      process.env.FILE_API_KEY = 'test-key';

      jest.resetModules();
      const { validateConfig: validate } = require('../../config');

      expect(() => validate()).toThrow('PORT must be a valid number between 1 and 65535');
    });

    it('должен выбрасывать ошибку если MAX_FILE_SIZE невалиден (отрицательное)', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3002';
      process.env.MAX_FILE_SIZE = '-1';
      process.env.ALLOWED_EXTENSIONS = 'jpg,png';
      process.env.FILE_API_KEY = 'test-key';

      jest.resetModules();
      const { validateConfig: validate } = require('../../config');

      expect(() => validate()).toThrow('MAX_FILE_SIZE must be a positive number');
    });

    it('должен выбрасывать ошибку если MAX_FILE_SIZE невалиден (ноль)', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3002';
      process.env.MAX_FILE_SIZE = '0';
      process.env.ALLOWED_EXTENSIONS = 'jpg,png';
      process.env.FILE_API_KEY = 'test-key';

      jest.resetModules();
      const { validateConfig: validate } = require('../../config');

      expect(() => validate()).toThrow('MAX_FILE_SIZE must be a positive number');
    });

    it('должен выбрасывать ошибку если MAX_FILE_SIZE не является числом', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3002';
      process.env.MAX_FILE_SIZE = 'invalid';
      process.env.ALLOWED_EXTENSIONS = 'jpg,png';
      process.env.FILE_API_KEY = 'test-key';

      jest.resetModules();
      const { validateConfig: validate } = require('../../config');

      expect(() => validate()).toThrow('MAX_FILE_SIZE must be a positive number');
    });

    
    it('должен выбрасывать ошибку если S3 включен но S3_BUCKET_NAME отсутствует', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3002';
      process.env.MAX_FILE_SIZE = '52428800';
      process.env.ALLOWED_EXTENSIONS = 'jpg,png';
      process.env.FILE_API_KEY = 'test-key';
      process.env.S3_ENABLED = 'true';
      delete process.env.S3_BUCKET_NAME;

      jest.resetModules();
      const { validateConfig: validate } = require('../../config');

      expect(() => validate()).toThrow('S3_BUCKET_NAME is required when S3_ENABLED=true');
    });

    it('должен выбрасывать ошибку если S3 включен но S3_ACCESS_KEY_ID отсутствует', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3002';
      process.env.MAX_FILE_SIZE = '52428800';
      process.env.ALLOWED_EXTENSIONS = 'jpg,png';
      process.env.FILE_API_KEY = 'test-key';
      process.env.S3_ENABLED = 'true';
      process.env.S3_BUCKET_NAME = 'test-bucket';
      delete process.env.S3_ACCESS_KEY_ID;

      jest.resetModules();
      const { validateConfig: validate } = require('../../config');

      expect(() => validate()).toThrow('S3_ACCESS_KEY_ID is required when S3_ENABLED=true');
    });

    it('должен выбрасывать ошибку если S3 включен но S3_SECRET_ACCESS_KEY отсутствует', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3002';
      process.env.MAX_FILE_SIZE = '52428800';
      process.env.ALLOWED_EXTENSIONS = 'jpg,png';
      process.env.FILE_API_KEY = 'test-key';
      process.env.S3_ENABLED = 'true';
      process.env.S3_BUCKET_NAME = 'test-bucket';
      process.env.S3_ACCESS_KEY_ID = 'test-key';
      delete process.env.S3_SECRET_ACCESS_KEY;

      jest.resetModules();
      const { validateConfig: validate } = require('../../config');

      expect(() => validate()).toThrow('S3_SECRET_ACCESS_KEY is required when S3_ENABLED=true');
    });

    it('должен проходить валидацию если S3 включен но S3_REGION использует дефолтное значение', () => {
      // S3_REGION имеет дефолтное значение 'us-east-1', поэтому отсутствие не должно вызывать ошибку
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3002';
      process.env.MAX_FILE_SIZE = '52428800';
      process.env.ALLOWED_EXTENSIONS = 'jpg,png';
      process.env.FILE_API_KEY = 'test-key';
      process.env.S3_ENABLED = 'true';
      process.env.S3_BUCKET_NAME = 'test-bucket';
      process.env.S3_ACCESS_KEY_ID = 'test-key';
      process.env.S3_SECRET_ACCESS_KEY = 'test-secret';
      delete process.env.S3_REGION;

      jest.resetModules();
      const { validateConfig: validate } = require('../../config');

      // Должен пройти, так как S3_REGION имеет дефолтное значение
      expect(() => validate()).not.toThrow();
    });

    it('должен проходить валидацию если S3 отключен', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3002';
      process.env.MAX_FILE_SIZE = '52428800';
      process.env.ALLOWED_EXTENSIONS = 'jpg,png';
      process.env.FILE_API_KEY = 'test-key';
      process.env.S3_ENABLED = 'false';

      jest.resetModules();
      const { validateConfig: validate } = require('../../config');

      expect(() => validate()).not.toThrow();
    });

    it('должен собирать все ошибки валидации в одном сообщении', () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '0';
      process.env.MAX_FILE_SIZE = '-1';
      process.env.ALLOWED_EXTENSIONS = 'jpg,png'; // Валидное значение
      delete process.env.FILE_API_KEY;

      jest.resetModules();
      const { validateConfig: validate } = require('../../config');

      try {
        validate();
        fail('Должна была быть выброшена ошибка');
      } catch (error) {
        const errorMessage = (error as Error).message;
        expect(errorMessage).toContain('FILE_API_KEY is required');
        expect(errorMessage).toContain('PORT must be a valid number');
        expect(errorMessage).toContain('MAX_FILE_SIZE must be a positive number');
      }
    });
  });

  describe('config.server.cors.getOrigins', () => {
    it('должен возвращать true если origin не задан в development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.CORS_ORIGIN;

      jest.resetModules();
      const { config: testConfig } = require('../../config');

      const result = testConfig.server.cors.getOrigins();
      expect(result).toBe(true);
    });

    it('должен возвращать false если origin не задан в production', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.CORS_ORIGIN;

      jest.resetModules();
      const { config: testConfig } = require('../../config');

      const result = testConfig.server.cors.getOrigins();
      expect(result).toBe(false);
    });

    it('должен возвращать строку если задан один origin', () => {
      process.env.CORS_ORIGIN = 'https://example.com';

      jest.resetModules();
      const { config: testConfig } = require('../../config');

      const result = testConfig.server.cors.getOrigins();
      expect(result).toBe('https://example.com');
    });

    it('должен возвращать массив если задано несколько origins через запятую', () => {
      process.env.CORS_ORIGIN = 'https://example.com,https://test.com,https://dev.com';

      jest.resetModules();
      const { config: testConfig } = require('../../config');

      const result = testConfig.server.cors.getOrigins();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(['https://example.com', 'https://test.com', 'https://dev.com']);
    });

    it('должен обрезать пробелы в origins', () => {
      process.env.CORS_ORIGIN = 'https://example.com , https://test.com , https://dev.com';

      jest.resetModules();
      const { config: testConfig } = require('../../config');

      const result = testConfig.server.cors.getOrigins();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(['https://example.com', 'https://test.com', 'https://dev.com']);
    });

    it('должен возвращать true как fallback если origin не строка и не boolean', () => {
      // Это edge case, который теоретически не должен произойти,
      // но метод имеет fallback на true
      process.env.NODE_ENV = 'test';
      delete process.env.CORS_ORIGIN;

      jest.resetModules();
      const { config: testConfig } = require('../../config');

      // Мокаем origin как не строку и не boolean (через прямое присваивание)
      // В реальности это не должно произойти, но тестируем fallback
      const originalOrigin = testConfig.server.cors.origin;
      testConfig.server.cors.origin = null; // Симулируем неожиданное значение

      const result = testConfig.server.cors.getOrigins();
      expect(result).toBe(true);

      // Восстанавливаем
      testConfig.server.cors.origin = originalOrigin;
    });
  });
});

