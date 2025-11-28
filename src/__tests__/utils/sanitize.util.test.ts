import { SanitizeUtil } from '../../utils/sanitize.util';

describe('SanitizeUtil', () => {
  describe('sanitizeFolderName', () => {
    it('должен санитизировать валидное имя папки', () => {
      expect(SanitizeUtil.sanitizeFolderName('products')).toBe('products');
      expect(SanitizeUtil.sanitizeFolderName('my-folder_123')).toBe('my-folder_123');
    });

    it('должен удалять опасные символы', () => {
      expect(SanitizeUtil.sanitizeFolderName('folder<script>')).toBe('folderscript');
      expect(SanitizeUtil.sanitizeFolderName('folder/../test')).toBe('foldertest');
      expect(SanitizeUtil.sanitizeFolderName('folder\\test')).toBe('foldertest');
    });

    it('должен ограничивать длину до 50 символов', () => {
      const longName = 'a'.repeat(100);
      expect(SanitizeUtil.sanitizeFolderName(longName).length).toBeLessThanOrEqual(50);
    });

    it('должен возвращать default для пустой строки', () => {
      expect(SanitizeUtil.sanitizeFolderName('')).toBe('default');
      expect(SanitizeUtil.sanitizeFolderName('   ')).toBe('default');
    });

    it('должен возвращать default для невалидных типов', () => {
      expect(SanitizeUtil.sanitizeFolderName(null as unknown as string)).toBe('default');
      expect(SanitizeUtil.sanitizeFolderName(undefined as unknown as string)).toBe('default');
      expect(SanitizeUtil.sanitizeFolderName(123 as unknown as string)).toBe('default');
    });
  });

  describe('sanitizePrefix', () => {
    it('должен санитизировать валидный префикс', () => {
      expect(SanitizeUtil.sanitizePrefix('product')).toBe('product');
      expect(SanitizeUtil.sanitizePrefix('image_123')).toBe('image_123');
    });

    it('должен удалять опасные символы', () => {
      expect(SanitizeUtil.sanitizePrefix('prefix<script>')).toBe('prefixscript');
      expect(SanitizeUtil.sanitizePrefix('prefix/../test')).toBe('prefixtest');
    });

    it('должен ограничивать длину до 50 символов', () => {
      const longPrefix = 'a'.repeat(100);
      expect(SanitizeUtil.sanitizePrefix(longPrefix).length).toBeLessThanOrEqual(50);
    });

    it('должен возвращать file для пустой строки', () => {
      expect(SanitizeUtil.sanitizePrefix('')).toBe('file');
    });
  });

  describe('sanitizeFileName', () => {
    it('должен санитизировать валидное имя файла', () => {
      expect(SanitizeUtil.sanitizeFileName('image.jpg')).toBe('image.jpg');
      expect(SanitizeUtil.sanitizeFileName('my-file_123.pdf')).toBe('my-file_123.pdf');
    });

    it('должен сохранять расширение', () => {
      expect(SanitizeUtil.sanitizeFileName('file.txt')).toBe('file.txt');
      expect(SanitizeUtil.sanitizeFileName('image.png')).toBe('image.png');
    });

    it('должен удалять опасные символы, но сохранять точку', () => {
      expect(SanitizeUtil.sanitizeFileName('file<script>.txt')).toBe('filescript.txt');
      // / и .. удаляются, остается только точка
      expect(SanitizeUtil.sanitizeFileName('file/../test.jpg')).toMatch(/^file.*test\.jpg$/);
    });

    it('должен ограничивать длину до 255 символов', () => {
      const longName = 'a'.repeat(300) + '.txt';
      expect(SanitizeUtil.sanitizeFileName(longName).length).toBeLessThanOrEqual(255);
    });

    it('должен возвращать file для пустой строки', () => {
      expect(SanitizeUtil.sanitizeFileName('')).toBe('file');
    });
  });
});

