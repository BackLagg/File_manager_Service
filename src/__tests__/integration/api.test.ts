import request from 'supertest';
import { Express } from 'express';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import * as os from 'os';

// Настраиваем тестовое окружение перед импортом модулей
const testStoragePath = path.join(os.tmpdir(), `file-service-integration-${Date.now()}`);
const apiKey = 'test-api-key-123';

process.env.FILE_API_KEY = apiKey;
process.env.S3_ENABLED = 'false';
process.env.STORAGE_PATH = testStoragePath;
process.env.NODE_ENV = 'test';
process.env.MAX_FILE_SIZE = '10485760';
process.env.ALLOWED_EXTENSIONS = 'jpg,png,pdf,txt';

// Мокаем config перед импортом приложения
jest.mock('../../config', () => {
  const originalModule = jest.requireActual('../../config');
  return {
    ...originalModule,
    config: {
      ...originalModule.config,
      server: {
        ...originalModule.config.server,
        apiKey: apiKey,
        nodeEnv: 'test',
      },
      storage: {
        ...originalModule.config.storage,
        path: testStoragePath,
        maxFileSize: 10485760,
        allowedExtensions: ['jpg', 'png', 'pdf', 'txt'],
      },
      s3: {
        ...originalModule.config.s3,
        enabled: false,
      },
    },
  };
});

import { createApp } from '../../app';
import { registerDefaultStorageProviders } from '../../services/storage-providers';

describe('API Integration Tests', () => {
  let app: Express;

  beforeAll(async () => {
    // Регистрируем провайдеры
    registerDefaultStorageProviders();

    app = createApp();
  });

  afterAll(async () => {
    try {
      await fsPromises.rm(testStoragePath, { recursive: true, force: true });
    } catch {
      // Игнорируем ошибки
    }
  });

  describe('GET /health', () => {
    it('должен возвращать статус ok', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/status', () => {
    it('должен требовать API ключ', async () => {
      const response = await request(app).get('/api/status');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('API key is required');
    });

    it('должен возвращать статус хранилища с валидным API ключом', async () => {
      const response = await request(app)
        .get('/api/status')
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(200);
      expect(response.body.available).toBe(true);
      expect(response.body.storageType).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    it('должен отклонять невалидный API ключ', async () => {
      const response = await request(app)
        .get('/api/status')
        .set('X-API-Key', 'wrong-key');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Invalid API key');
    });
  });

  describe('POST /api/upload', () => {
    it('должен требовать API ключ', async () => {
      const response = await request(app).post('/api/upload');

      expect(response.status).toBe(401);
    });

    it('должен загружать файл с валидным API ключом', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('X-API-Key', apiKey)
        .attach('file', Buffer.from('test content'), 'test.txt')
        .field('folder', 'test-folder')
        .field('prefix', 'test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.filename).toBeDefined();
      expect(response.body.url).toBeDefined();
      expect(response.body.path).toBeDefined();
      expect(response.body.size).toBeDefined();
    });

    it('должен отклонять файлы превышающие лимит размера', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB (больше лимита 10MB)

      const response = await request(app)
        .post('/api/upload')
        .set('X-API-Key', apiKey)
        .attach('file', largeBuffer, 'large.txt')
        .field('folder', 'test-folder');

      expect(response.status).toBe(400);
    });

    it('должен отклонять неразрешенные типы файлов', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('X-API-Key', apiKey)
        .attach('file', Buffer.from('executable'), 'script.exe')
        .field('folder', 'test-folder');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not allowed');
    });
  });

  describe('DELETE /api/delete', () => {
    let uploadedFilePath: string;

    beforeEach(async () => {
      // Загружаем файл для тестов удаления
      const uploadResponse = await request(app)
        .post('/api/upload')
        .set('X-API-Key', apiKey)
        .attach('file', Buffer.from('test content'), 'test-delete.txt')
        .field('folder', 'test-folder');

      uploadedFilePath = uploadResponse.body.url;
    });

    it('должен требовать API ключ', async () => {
      const response = await request(app).delete('/api/delete').send({ path: uploadedFilePath });

      expect(response.status).toBe(401);
    });

    it('должен удалять файл с валидным API ключом', async () => {
      const response = await request(app)
        .delete('/api/delete')
        .set('X-API-Key', apiKey)
        .send({ path: uploadedFilePath });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('должен возвращать 404 для несуществующего файла', async () => {
      const response = await request(app)
        .delete('/api/delete')
        .set('X-API-Key', apiKey)
        .send({ path: '/files/nonexistent/file.txt' });

      expect(response.status).toBe(404);
    });

    it('должен требовать path в теле запроса', async () => {
      const response = await request(app)
        .delete('/api/delete')
        .set('X-API-Key', apiKey)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('File path is required');
    });
  });

  describe('GET /api/exists', () => {
    let uploadedFilePath: string;

    beforeEach(async () => {
      const uploadResponse = await request(app)
        .post('/api/upload')
        .set('X-API-Key', apiKey)
        .attach('file', Buffer.from('test'), 'test-exists.txt')
        .field('folder', 'test-folder');

      uploadedFilePath = uploadResponse.body.url;
    });

    it('должен требовать API ключ', async () => {
      const response = await request(app).get('/api/exists').query({ path: uploadedFilePath });

      expect(response.status).toBe(401);
    });

    it('должен возвращать true для существующего файла', async () => {
      const response = await request(app)
        .get('/api/exists')
        .set('X-API-Key', apiKey)
        .query({ path: uploadedFilePath });

      expect(response.status).toBe(200);
      expect(response.body.exists).toBe(true);
    });

    it('должен возвращать false для несуществующего файла', async () => {
      const response = await request(app)
        .get('/api/exists')
        .set('X-API-Key', apiKey)
        .query({ path: '/files/nonexistent/file.txt' });

      expect(response.status).toBe(200);
      expect(response.body.exists).toBe(false);
    });

    it('должен требовать path параметр', async () => {
      const response = await request(app)
        .get('/api/exists')
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('File path is required');
    });
  });

  describe('GET /files/*', () => {
    let uploadedFileUrl: string;

    beforeEach(async () => {
      const uploadResponse = await request(app)
        .post('/api/upload')
        .set('X-API-Key', apiKey)
        .attach('file', Buffer.from('test file content'), 'test-get.txt')
        .field('folder', 'test-folder');

      expect(uploadResponse.status).toBe(200);
      expect(uploadResponse.body.url).toBeDefined();
      uploadedFileUrl = uploadResponse.body.url;
    });

    it('должен возвращать файл без API ключа (публичный endpoint)', async () => {
      // Извлекаем путь из URL (может быть относительный путь)
      const filePath = uploadedFileUrl && uploadedFileUrl.startsWith('http')
        ? new URL(uploadedFileUrl).pathname
        : uploadedFileUrl;

      const response = await request(app).get(filePath);

      expect(response.status).toBe(200);
      expect(response.text).toBe('test file content');
    });

    it('должен возвращать 404 для несуществующего файла', async () => {
      const response = await request(app).get('/files/nonexistent/file.txt');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('File not found');
    });

    it('должен защищать от path traversal', async () => {
      const response = await request(app).get('/files/../../etc/passwd');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid file path');
    });
  });
});
