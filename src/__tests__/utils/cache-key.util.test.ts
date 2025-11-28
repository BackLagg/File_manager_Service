import { CacheKeyUtil } from '../../utils/cache-key.util';

describe('CacheKeyUtil', () => {
  describe('forLocalFileExists', () => {
    it('должен генерировать ключ для локального файла', () => {
      const key = CacheKeyUtil.forLocalFileExists('folder/file.jpg');
      expect(key).toBe('local:exists:folder/file.jpg');
    });

    it('должен обрабатывать вложенные пути', () => {
      const key = CacheKeyUtil.forLocalFileExists('products/images/photo.png');
      expect(key).toBe('local:exists:products/images/photo.png');
    });
  });

  describe('forS3FileExists', () => {
    it('должен генерировать ключ для S3 файла', () => {
      const key = CacheKeyUtil.forS3FileExists('my-bucket', 'folder/file.jpg');
      expect(key).toBe('s3:exists:my-bucket:folder/file.jpg');
    });

    it('должен обрабатывать разные bucket names', () => {
      const key1 = CacheKeyUtil.forS3FileExists('bucket1', 'file.jpg');
      const key2 = CacheKeyUtil.forS3FileExists('bucket2', 'file.jpg');

      expect(key1).not.toBe(key2);
      expect(key1).toBe('s3:exists:bucket1:file.jpg');
      expect(key2).toBe('s3:exists:bucket2:file.jpg');
    });
  });

  describe('forS3Availability', () => {
    it('должен генерировать ключ для проверки доступности S3', () => {
      const key = CacheKeyUtil.forS3Availability('my-bucket');
      expect(key).toBe('s3:available:my-bucket');
    });

    it('должен создавать уникальные ключи для разных bucket', () => {
      const key1 = CacheKeyUtil.forS3Availability('bucket1');
      const key2 = CacheKeyUtil.forS3Availability('bucket2');

      expect(key1).not.toBe(key2);
    });
  });
});

