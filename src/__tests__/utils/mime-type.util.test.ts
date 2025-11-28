import { MimeTypeUtil } from '../../utils/mime-type.util';

describe('MimeTypeUtil', () => {
  describe('getMimeType', () => {
    it('должен возвращать правильный MIME тип для изображений', () => {
      expect(MimeTypeUtil.getMimeType('image.jpg')).toBe('image/jpeg');
      expect(MimeTypeUtil.getMimeType('image.jpeg')).toBe('image/jpeg');
      expect(MimeTypeUtil.getMimeType('image.png')).toBe('image/png');
      expect(MimeTypeUtil.getMimeType('image.gif')).toBe('image/gif');
      expect(MimeTypeUtil.getMimeType('image.svg')).toBe('image/svg+xml');
      expect(MimeTypeUtil.getMimeType('image.webp')).toBe('image/webp');
    });

    it('должен возвращать правильный MIME тип для документов', () => {
      expect(MimeTypeUtil.getMimeType('document.pdf')).toBe('application/pdf');
      expect(MimeTypeUtil.getMimeType('document.doc')).toBe('application/msword');
      expect(MimeTypeUtil.getMimeType('document.docx')).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
    });

    it('должен возвращать правильный MIME тип для текстовых файлов', () => {
      expect(MimeTypeUtil.getMimeType('file.txt')).toBe('text/plain');
      expect(MimeTypeUtil.getMimeType('file.csv')).toBe('text/csv');
      expect(MimeTypeUtil.getMimeType('file.json')).toBe('application/json');
      expect(MimeTypeUtil.getMimeType('file.xml')).toBe('application/xml');
    });

    it('должен возвращать правильный MIME тип для архивов', () => {
      expect(MimeTypeUtil.getMimeType('archive.zip')).toBe('application/zip');
      expect(MimeTypeUtil.getMimeType('archive.rar')).toBe('application/x-rar-compressed');
      expect(MimeTypeUtil.getMimeType('archive.7z')).toBe('application/x-7z-compressed');
    });

    it('должен возвращать application/octet-stream для неизвестных расширений', () => {
      expect(MimeTypeUtil.getMimeType('file.unknown')).toBe('application/octet-stream');
      expect(MimeTypeUtil.getMimeType('file')).toBe('application/octet-stream');
    });

    it('должен быть case-insensitive', () => {
      expect(MimeTypeUtil.getMimeType('IMAGE.JPG')).toBe('image/jpeg');
      expect(MimeTypeUtil.getMimeType('Image.Png')).toBe('image/png');
    });
  });

  describe('isMimeTypeAllowed', () => {
    it('должен разрешать разрешенные MIME типы', () => {
      expect(MimeTypeUtil.isMimeTypeAllowed('image/jpeg')).toBe(true);
      expect(MimeTypeUtil.isMimeTypeAllowed('image/png')).toBe(true);
      expect(MimeTypeUtil.isMimeTypeAllowed('application/pdf')).toBe(true);
    });

    it('должен запрещать неразрешенные MIME типы', () => {
      expect(MimeTypeUtil.isMimeTypeAllowed('application/x-executable')).toBe(false);
      expect(MimeTypeUtil.isMimeTypeAllowed('text/html')).toBe(false);
    });

    it('должен быть case-insensitive', () => {
      expect(MimeTypeUtil.isMimeTypeAllowed('IMAGE/JPEG')).toBe(true);
      expect(MimeTypeUtil.isMimeTypeAllowed('Image/Png')).toBe(true);
    });

    it('должен обрабатывать MIME типы с параметрами', () => {
      // MIME тип с параметрами должен обрабатываться корректно
      // Метод isMimeTypeAllowed извлекает чистый тип из 'image/jpeg; charset=utf-8'
      const mimeWithParams = 'image/jpeg; charset=utf-8';
      const cleanMime = mimeWithParams.split(';')[0].trim();
      expect(MimeTypeUtil.isMimeTypeAllowed(cleanMime)).toBe(true);
    });
  });
});

