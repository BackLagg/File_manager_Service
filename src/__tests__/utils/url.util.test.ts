import { UrlUtil } from '../../utils/url.util';

// Мокаем config
jest.mock('../../config', () => ({
  config: {
    s3: {
      cdnUrl: '',
      endpoint: '',
      region: 'us-east-1',
    },
  },
}));

describe('UrlUtil', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('buildS3Url', () => {
    it('должен формировать стандартный AWS S3 URL', () => {
      jest.doMock('../../config', () => ({
        config: {
          s3: {
            cdnUrl: '',
            endpoint: '',
            region: 'us-east-1',
          },
        },
      }));

      const { UrlUtil: Util } = require('../../utils/url.util');
      const url = Util.buildS3Url('folder/file.jpg', 'my-bucket', 'us-east-1');
      expect(url).toBe('https://my-bucket.s3.us-east-1.amazonaws.com/folder/file.jpg');
    });

    it('должен использовать CDN URL если настроен', () => {
      jest.doMock('../../config', () => ({
        config: {
          s3: {
            cdnUrl: 'https://d1234567890.cloudfront.net',
            endpoint: '',
            region: 'us-east-1',
          },
        },
      }));

      const { UrlUtil: Util } = require('../../utils/url.util');
      const url = Util.buildS3Url('folder/file.jpg', 'my-bucket', 'us-east-1');
      expect(url).toBe('https://d1234567890.cloudfront.net/folder/file.jpg');
    });

    it('должен использовать кастомный endpoint если настроен', () => {
      jest.doMock('../../config', () => ({
        config: {
          s3: {
            cdnUrl: '',
            endpoint: 'http://localhost:9000',
            region: 'us-east-1',
          },
        },
      }));

      const { UrlUtil: Util } = require('../../utils/url.util');
      const url = Util.buildS3Url('folder/file.jpg', 'my-bucket', 'us-east-1');
      expect(url).toBe('http://localhost:9000/my-bucket/folder/file.jpg');
    });
  });

  describe('buildLocalUrl', () => {
    it('должен формировать URL для локального файла', () => {
      const url = UrlUtil.buildLocalUrl('products', 'image.jpg');
      expect(url).toBe('/files/products/image.jpg');
    });

    it('должен обрабатывать вложенные папки', () => {
      const url = UrlUtil.buildLocalUrl('products/images', 'photo.png');
      expect(url).toBe('/files/products/images/photo.png');
    });
  });
});

