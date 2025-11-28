import { S3ErrorUtil } from '../../utils/s3-error.util';

describe('S3ErrorUtil', () => {
  describe('isNotFoundError', () => {
    it('должен возвращать true для ошибки 404', () => {
      const error = {
        $metadata: {
          httpStatusCode: 404,
        },
      };

      expect(S3ErrorUtil.isNotFoundError(error)).toBe(true);
    });

    it('должен возвращать false для других ошибок', () => {
      const error403 = {
        $metadata: {
          httpStatusCode: 403,
        },
      };

      const error500 = {
        $metadata: {
          httpStatusCode: 500,
        },
      };

      expect(S3ErrorUtil.isNotFoundError(error403)).toBe(false);
      expect(S3ErrorUtil.isNotFoundError(error500)).toBe(false);
    });

    it('должен возвращать false для ошибок без $metadata', () => {
      const error = new Error('Some error');
      expect(S3ErrorUtil.isNotFoundError(error)).toBe(false);
    });

    it('должен возвращать false для null', () => {
      expect(S3ErrorUtil.isNotFoundError(null)).toBe(false);
    });

    it('должен возвращать false для undefined', () => {
      expect(S3ErrorUtil.isNotFoundError(undefined)).toBe(false);
    });

    it('должен возвращать false для примитивных типов', () => {
      expect(S3ErrorUtil.isNotFoundError('string')).toBe(false);
      expect(S3ErrorUtil.isNotFoundError(123)).toBe(false);
    });
  });
});

