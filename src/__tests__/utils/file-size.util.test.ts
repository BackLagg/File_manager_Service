import { FileSizeUtil } from '../../utils/file-size.util';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('FileSizeUtil', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `file-size-test-${Date.now()}`);
    await fsPromises.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fsPromises.rm(testDir, { recursive: true, force: true });
    } catch {
      // Игнорируем ошибки
    }
  });

  describe('getFileSize', () => {
    it('должен возвращать размер Buffer', async () => {
      const buffer = Buffer.from('test content');
      const size = await FileSizeUtil.getFileSize(buffer);
      expect(size).toBe(buffer.length);
    });

    it('должен возвращать размер файла по пути', async () => {
      const filePath = path.join(testDir, 'test.txt');
      const content = 'test file content';
      await fsPromises.writeFile(filePath, content);

      const size = await FileSizeUtil.getFileSize(filePath);
      expect(size).toBe(Buffer.from(content).length);
    });

    it('должен корректно обрабатывать пустой Buffer', async () => {
      const buffer = Buffer.alloc(0);
      const size = await FileSizeUtil.getFileSize(buffer);
      expect(size).toBe(0);
    });

    it('должен корректно обрабатывать большой Buffer', async () => {
      const buffer = Buffer.alloc(1024 * 1024); // 1MB
      const size = await FileSizeUtil.getFileSize(buffer);
      expect(size).toBe(1024 * 1024);
    });
  });
});

