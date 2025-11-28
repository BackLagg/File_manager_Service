import { S3StorageService } from '../../services/s3-storage.service';
import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// Мокаем AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn(),
  HeadObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
}));

// Мокаем config
jest.mock('../../config', () => ({
  config: {
    server: {
      nodeEnv: 'test',
    },
    s3: {
      enabled: true,
      bucketName: 'test-bucket',
      region: 'us-east-1',
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
      endpoint: '',
      cdnUrl: '',
    },
    storage: {
      allowedExtensions: ['jpg', 'png', 'pdf', 'txt'],
    },
  },
}));

describe('S3StorageService', () => {
  let service: S3StorageService;
  let mockSend: jest.Mock;

  beforeEach(() => {
    mockSend = jest.fn();
    (S3Client as jest.MockedClass<typeof S3Client>).mockImplementation(() => ({
      send: mockSend,
    }) as unknown as S3Client);

    service = new S3StorageService();
  });

  describe('isAvailable', () => {
    it('должен возвращать true если S3 доступен', async () => {
      mockSend.mockResolvedValueOnce({});

      const available = await service.isAvailable();
      expect(available).toBe(true);
    });

    it('должен возвращать false если S3 недоступен', async () => {
      // Очищаем кэш перед тестом
      service['cache'].clear();
      mockSend.mockRejectedValueOnce(new Error('S3 error'));

      const available = await service.isAvailable();
      expect(available).toBe(false);
    });
  });

  describe('uploadFile', () => {
    it('должен загружать файл в S3', async () => {
      const buffer = Buffer.from('test content');
      mockSend.mockResolvedValueOnce({});

      const result = await service.uploadFile(buffer, 'test.txt', 'test-folder', 'text/plain');

      expect(result.success).toBe(true);
      expect(result.filename).toBe('test.txt');
      expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });

    it('должен обрабатывать ошибки загрузки', async () => {
      const buffer = Buffer.from('test');
      mockSend.mockRejectedValueOnce(new Error('Upload failed'));

      await expect(
        service.uploadFile(buffer, 'test.txt', 'folder', 'text/plain'),
      ).rejects.toThrow();
    });
  });

  describe('deleteFile', () => {
    it('должен удалять файл из S3', async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await service.deleteFile('/files/folder/test.txt');

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
    });

    it('должен обрабатывать ошибки удаления', async () => {
      mockSend.mockRejectedValueOnce(new Error('Delete failed'));

      const result = await service.deleteFile('/files/folder/test.txt');
      expect(result.success).toBe(false);
    });
  });

  describe('fileExists', () => {
    it('должен возвращать true для существующего файла', async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await service.fileExists('/files/folder/test.txt');

      expect(result.exists).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(expect.any(HeadObjectCommand));
    });

    it('должен возвращать false для несуществующего файла', async () => {
      const error = new Error('Not found');
      (error as unknown as { $metadata: { httpStatusCode: number } }).$metadata = {
        httpStatusCode: 404,
      };
      mockSend.mockRejectedValueOnce(error);

      const result = await service.fileExists('/files/folder/nonexistent.txt');

      expect(result.exists).toBe(false);
    });
  });

  describe('getFile', () => {
    it('должен возвращать содержимое файла', async () => {
      const content = Buffer.from('test content');
      const stream = new Readable({
        read() {
          this.push(content);
          this.push(null);
        },
      });

      mockSend.mockResolvedValueOnce({
        Body: stream,
      });

      const result = await service.getFile('/files/folder/test.txt');

      expect(result).not.toBeNull();
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('должен возвращать null для несуществующего файла', async () => {
      const error = new Error('Not found');
      (error as unknown as { $metadata: { httpStatusCode: number } }).$metadata = {
        httpStatusCode: 404,
      };
      mockSend.mockRejectedValueOnce(error);

      const result = await service.getFile('/files/folder/nonexistent.txt');

      expect(result).toBeNull();
    });
  });

  describe('getFileStream', () => {
    it('должен возвращать поток для существующего файла', async () => {
      const content = Buffer.from('test stream content');
      const stream = new Readable({
        read() {
          this.push(content);
          this.push(null);
        },
      });

      mockSend.mockResolvedValueOnce({
        Body: stream,
      });

      const result = await service.getFileStream('/files/folder/test.txt');

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Readable);
    });

    it('должен возвращать null для несуществующего файла', async () => {
      const error = new Error('Not found');
      (error as unknown as { $metadata: { httpStatusCode: number } }).$metadata = {
        httpStatusCode: 404,
      };
      mockSend.mockRejectedValueOnce(error);

      const result = await service.getFileStream('/files/folder/nonexistent.txt');

      expect(result).toBeNull();
    });
  });
});

