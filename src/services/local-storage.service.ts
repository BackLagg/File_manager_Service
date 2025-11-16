import { promises as fsPromises, createReadStream } from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { config } from '../config';
import { FileUtil } from '../utils/file.util';
import { FileSizeUtil } from '../utils/file-size.util';
import { UrlUtil } from '../utils/url.util';
import { CacheKeyUtil } from '../utils/cache-key.util';
import { FileUploadResult, FileDeleteResult, FileExistsResult } from './storage.interface';
import { BaseStorageService } from './base-storage.service';
import { getLogger } from './logger.service';

const logger = getLogger();

export class LocalStorageService extends BaseStorageService {
  private storagePath: string;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    super();
    this.storagePath = path.resolve(config.storage.path);
  }

  /**
   * Инициализирует хранилище (создает директорию если нужно)
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initializationPromise) {
      this.initializationPromise = FileUtil.ensureDirectory(this.storagePath);
    }
    await this.initializationPromise;
  }

  async uploadFile(
    source: Buffer | string,
    filename: string,
    folder: string,
  ): Promise<FileUploadResult> {
    await this.ensureInitialized();
    const folderPath = path.join(this.storagePath, folder);
    await FileUtil.ensureDirectory(folderPath);

    const filePath = path.join(folderPath, filename);

    if (typeof source === 'string') {
      await fsPromises.copyFile(source, filePath);
    } else {
      await fsPromises.writeFile(filePath, source);
    }

    const fileSize = await FileSizeUtil.getFileSize(typeof source === 'string' ? filePath : source);

    const relativePath = `${folder}/${filename}`;
    const cacheKey = CacheKeyUtil.forLocalFileExists(relativePath);
    this.invalidateCache(cacheKey);

    const url = UrlUtil.buildLocalUrl(folder, filename);

    return {
      success: true,
      filename,
      path: filePath,
      url,
      size: fileSize,
    };
  }

  async deleteFile(filePath: string): Promise<FileDeleteResult> {
    try {
      const relativePath = this.extractAndValidatePath(filePath);
      if (!relativePath) {
        return {
          success: false,
          message: 'Invalid file path',
        };
      }

      const fullPath = path.join(this.storagePath, relativePath);
      const exists = await FileUtil.fileExists(fullPath);
      const cacheKey = CacheKeyUtil.forLocalFileExists(relativePath);

      if (!exists) {
        this.invalidateCache(cacheKey);
        return {
          success: true,
          message: 'File did not exist',
        };
      }

      const deleted = await FileUtil.deleteFile(fullPath);
      this.invalidateCache(cacheKey);

      return {
        success: deleted,
        message: deleted ? 'File deleted successfully' : 'Failed to delete file',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async fileExists(filePath: string): Promise<FileExistsResult> {
    const relativePath = this.extractAndValidatePath(filePath);
    if (!relativePath) {
      return { exists: false };
    }

    const cacheKey = CacheKeyUtil.forLocalFileExists(relativePath);

    return this.checkFileExistsWithCache(filePath, cacheKey, async (relPath) => {
      const fullPath = path.join(this.storagePath, relPath);
      return await FileUtil.fileExists(fullPath);
    });
  }

  async getFile(filePath: string): Promise<Buffer | null> {
    try {
      const relativePath = this.extractAndValidatePath(filePath);
      if (!relativePath) {
        return null;
      }

      const fullPath = path.join(this.storagePath, relativePath);
      const exists = await FileUtil.fileExists(fullPath);
      if (exists) {
        return await fsPromises.readFile(fullPath);
      }
      return null;
    } catch (error) {
      logger.error('Error getting file from local storage', error, { filePath });
      return null;
    }
  }

  async getFileStream(filePath: string): Promise<Readable | null> {
    try {
      const relativePath = this.extractAndValidatePath(filePath);
      if (!relativePath) {
        return null;
      }

      const fullPath = path.join(this.storagePath, relativePath);
      const exists = await FileUtil.fileExists(fullPath);
      if (exists) {
        return createReadStream(fullPath);
      }
      return null;
    } catch (error) {
      logger.error('Error getting file stream from local storage', error, { filePath });
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.ensureInitialized();
      const testFile = path.join(this.storagePath, '.test');
      await fsPromises.writeFile(testFile, 'test');
      await fsPromises.unlink(testFile);
      return true;
    } catch (error) {
      logger.error('Local storage is not available', error, { storagePath: this.storagePath });
      return false;
    }
  }
}
