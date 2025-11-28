import { FileUtil } from '../../utils/file.util';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('FileUtil', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `file-service-test-${Date.now()}`);
    await fsPromises.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fsPromises.rm(testDir, { recursive: true, force: true });
    } catch {
      // Игнорируем ошибки удаления
    }
  });

  describe('ensureDirectory', () => {
    it('должен создавать директорию если её нет', async () => {
      const dirPath = path.join(testDir, 'new-folder');
      await FileUtil.ensureDirectory(dirPath);

      const exists = await fsPromises.access(dirPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('должен не падать если директория уже существует', async () => {
      const dirPath = path.join(testDir, 'existing-folder');
      await fsPromises.mkdir(dirPath);

      await expect(FileUtil.ensureDirectory(dirPath)).resolves.not.toThrow();
    });

    it('должен создавать вложенные директории', async () => {
      const dirPath = path.join(testDir, 'nested', 'deep', 'folder');
      await FileUtil.ensureDirectory(dirPath);

      const exists = await fsPromises.access(dirPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('generateUniqueFilename', () => {
    it('должен генерировать уникальное имя файла', () => {
      const filename1 = FileUtil.generateUniqueFilename('image.jpg', 'product');
      const filename2 = FileUtil.generateUniqueFilename('image.jpg', 'product');

      expect(filename1).not.toBe(filename2);
      expect(filename1).toMatch(/^product-\d+-\d+\.jpg$/);
      expect(filename2).toMatch(/^product-\d+-\d+\.jpg$/);
    });

    it('должен сохранять расширение', () => {
      const filename = FileUtil.generateUniqueFilename('document.pdf', 'file');
      expect(filename).toMatch(/\.pdf$/);
    });

    it('должен использовать дефолтный префикс если не указан', () => {
      const filename = FileUtil.generateUniqueFilename('test.jpg');
      expect(filename).toMatch(/^file-\d+-\d+\.jpg$/);
    });
  });

  describe('isExtensionAllowed', () => {
    it('должен разрешать разрешенные расширения', () => {
      expect(FileUtil.isExtensionAllowed('image.jpg')).toBe(true);
      expect(FileUtil.isExtensionAllowed('image.png')).toBe(true);
      expect(FileUtil.isExtensionAllowed('document.pdf')).toBe(true);
      expect(FileUtil.isExtensionAllowed('file.txt')).toBe(true);
    });

    it('должен запрещать неразрешенные расширения', () => {
      expect(FileUtil.isExtensionAllowed('script.exe')).toBe(false);
      expect(FileUtil.isExtensionAllowed('malware.bat')).toBe(false);
    });

    it('должен быть case-insensitive', () => {
      expect(FileUtil.isExtensionAllowed('IMAGE.JPG')).toBe(true);
      expect(FileUtil.isExtensionAllowed('Image.Png')).toBe(true);
    });
  });

  describe('isSizeValid', () => {
    it('должен разрешать файлы в пределах лимита', () => {
      expect(FileUtil.isSizeValid(1024)).toBe(true);
      expect(FileUtil.isSizeValid(10485760)).toBe(true); // 10MB
    });

    it('должен запрещать файлы превышающие лимит', () => {
      const maxSize = 10485760; // 10MB из setup.ts
      expect(FileUtil.isSizeValid(maxSize + 1)).toBe(false);
    });
  });

  describe('fileExists', () => {
    it('должен возвращать true для существующего файла', async () => {
      const filePath = path.join(testDir, 'test.txt');
      await fsPromises.writeFile(filePath, 'test');

      expect(await FileUtil.fileExists(filePath)).toBe(true);
    });

    it('должен возвращать false для несуществующего файла', async () => {
      const filePath = path.join(testDir, 'nonexistent.txt');
      expect(await FileUtil.fileExists(filePath)).toBe(false);
    });
  });

  describe('deleteFile', () => {
    it('должен удалять существующий файл', async () => {
      const filePath = path.join(testDir, 'test.txt');
      await fsPromises.writeFile(filePath, 'test');

      const result = await FileUtil.deleteFile(filePath);
      expect(result).toBe(true);

      const exists = await fsPromises.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    });

    it('должен возвращать true для несуществующего файла (идемпотентность)', async () => {
      const filePath = path.join(testDir, 'nonexistent.txt');
      const result = await FileUtil.deleteFile(filePath);
      expect(result).toBe(true);
    });
  });
});

