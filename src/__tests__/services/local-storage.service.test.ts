import { promises as fsPromises } from 'fs';
import * as path from 'path';
import * as os from 'os';

// Мокаем config перед импортом
const testStoragePath = path.join(os.tmpdir(), `file-service-test-${Date.now()}`);

jest.mock('../../config', () => ({
  config: {
    server: {
      nodeEnv: 'test',
    },
    storage: {
      path: testStoragePath,
    },
  },
}));

import { LocalStorageService } from '../../services/local-storage.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(async () => {
    // Очищаем тестовую директорию перед каждым тестом
    try {
      await fsPromises.rm(testStoragePath, { recursive: true, force: true });
    } catch {
      // Игнорируем ошибки
    }

    service = new LocalStorageService();
    await service.isAvailable(); // Инициализация
  });

  afterEach(async () => {
    try {
      await fsPromises.rm(testStoragePath, { recursive: true, force: true });
    } catch {
      // Игнорируем ошибки
    }
  });

  afterAll(async () => {
    try {
      await fsPromises.rm(testStoragePath, { recursive: true, force: true });
    } catch {
      // Игнорируем ошибки
    }
  });

  describe('uploadFile', () => {
    it('должен загружать файл из Buffer', async () => {
      const buffer = Buffer.from('test content');
      const result = await service.uploadFile(buffer, 'test.txt', 'test-folder');

      expect(result.success).toBe(true);
      expect(result.filename).toBe('test.txt');
      expect(result.url).toContain('test-folder/test.txt');

      const filePath = path.join(testStoragePath, 'test-folder', 'test.txt');
      const exists = await fsPromises.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('должен загружать файл из пути', async () => {
      const tempFile = path.join(os.tmpdir(), `temp-${Date.now()}.txt`);
      await fsPromises.writeFile(tempFile, 'test content');

      try {
        const result = await service.uploadFile(tempFile, 'test.txt', 'test-folder');

        expect(result.success).toBe(true);
        const filePath = path.join(testStoragePath, 'test-folder', 'test.txt');
        const exists = await fsPromises.access(filePath).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      } finally {
        await fsPromises.unlink(tempFile).catch(() => {});
      }
    });

    it('должен создавать папки автоматически', async () => {
      const buffer = Buffer.from('test');
      await service.uploadFile(buffer, 'test.txt', 'nested/deep/folder');

      const folderPath = path.join(testStoragePath, 'nested', 'deep', 'folder');
      const exists = await fsPromises.access(folderPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('deleteFile', () => {
    it('должен удалять существующий файл', async () => {
      const buffer = Buffer.from('test');
      const result = await service.uploadFile(buffer, 'test.txt', 'folder');
      const fileUrl = result.url;

      const deleteResult = await service.deleteFile(fileUrl);
      expect(deleteResult.success).toBe(true);

      const exists = await fsPromises.access(result.path).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    });

    it('должен возвращать success для несуществующего файла (идемпотентность)', async () => {
      const result = await service.deleteFile('/files/nonexistent.txt');
      expect(result.success).toBe(true);
    });

    it('должен отклонять невалидные пути', async () => {
      const result = await service.deleteFile('../../etc/passwd');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid file path');
    });
  });

  describe('fileExists', () => {
    it('должен возвращать true для существующего файла', async () => {
      const buffer = Buffer.from('test');
      await service.uploadFile(buffer, 'test.txt', 'folder');

      const result = await service.fileExists('/files/folder/test.txt');
      expect(result.exists).toBe(true);
    });

    it('должен возвращать false для несуществующего файла', async () => {
      const result = await service.fileExists('/files/folder/nonexistent.txt');
      expect(result.exists).toBe(false);
    });
  });

  describe('getFile', () => {
    it('должен возвращать содержимое файла', async () => {
      const content = 'test file content';
      const buffer = Buffer.from(content);
      await service.uploadFile(buffer, 'test.txt', 'folder');

      const result = await service.getFile('/files/folder/test.txt');
      expect(result).not.toBeNull();
      expect(result?.toString()).toBe(content);
    });

    it('должен возвращать null для несуществующего файла', async () => {
      const result = await service.getFile('/files/folder/nonexistent.txt');
      expect(result).toBeNull();
    });
  });

  describe('getFileStream', () => {
    it('должен возвращать поток для существующего файла', async () => {
      const content = 'test stream content';
      const buffer = Buffer.from(content);
      await service.uploadFile(buffer, 'test.txt', 'folder');

      const stream = await service.getFileStream('/files/folder/test.txt');
      expect(stream).not.toBeNull();

      if (stream) {
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        const result = Buffer.concat(chunks).toString();
        expect(result).toBe(content);
      }
    });

    it('должен возвращать null для несуществующего файла', async () => {
      const stream = await service.getFileStream('/files/folder/nonexistent.txt');
      expect(stream).toBeNull();
    });
  });

  describe('isAvailable', () => {
    it('должен возвращать true если хранилище доступно', async () => {
      const available = await service.isAvailable();
      expect(available).toBe(true);
    });
  });
});

