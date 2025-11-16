import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import { config } from '../config';
import { FileSizeUtil } from '../utils/file-size.util';
import { UrlUtil } from '../utils/url.util';
import { CacheKeyUtil } from '../utils/cache-key.util';
import { S3ErrorUtil } from '../utils/s3-error.util';
import { FileUploadResult, FileDeleteResult, FileExistsResult } from './storage.interface';
import { BaseStorageService } from './base-storage.service';
import { getLogger } from './logger.service';

const logger = getLogger();

export class S3StorageService extends BaseStorageService {
  private s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly region: string;

  constructor() {
    super();
    this.bucketName = config.s3.bucketName;
    this.region = config.s3.region;

    if (config.s3.enabled) {
      interface S3Config {
        region: string;
        credentials: {
          accessKeyId: string;
          secretAccessKey: string;
        };
        endpoint?: string;
        forcePathStyle?: boolean;
      }

      const s3Config: S3Config = {
        region: config.s3.region,
        credentials: {
          accessKeyId: config.s3.accessKeyId,
          secretAccessKey: config.s3.secretAccessKey,
        },
      };

      if (config.s3.endpoint) {
        s3Config.endpoint = config.s3.endpoint;
        s3Config.forcePathStyle = true;
      }

      this.s3Client = new S3Client(s3Config);
    }
  }

  async uploadFile(
    source: Buffer | string,
    filename: string,
    folder: string,
    mimetype: string,
  ): Promise<FileUploadResult> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const key = `${folder}/${filename}`;

    let body: Buffer | Readable;
    if (typeof source === 'string') {
      body = createReadStream(source);
    } else {
      body = source;
    }

    const fileSize = await FileSizeUtil.getFileSize(source);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: body,
      ContentType: mimetype,
    });

    await this.s3Client.send(command);

    const cacheKey = CacheKeyUtil.forS3FileExists(this.bucketName, key);
    this.invalidateCache(cacheKey);

    const url = UrlUtil.buildS3Url(key, this.bucketName, this.region);

    return {
      success: true,
      filename,
      path: key,
      url,
      size: fileSize,
    };
  }

  async deleteFile(key: string): Promise<FileDeleteResult> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    try {
      const relativePath = this.extractAndValidatePath(key);
      if (!relativePath) {
        return {
          success: false,
          message: 'Invalid file path',
        };
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: relativePath,
      });

      await this.s3Client.send(command);

      const cacheKey = CacheKeyUtil.forS3FileExists(this.bucketName, relativePath);
      this.invalidateCache(cacheKey);

      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async fileExists(key: string): Promise<FileExistsResult> {
    if (!this.s3Client) {
      return { exists: false };
    }

    const relativePath = this.extractAndValidatePath(key);
    if (!relativePath) {
      return { exists: false };
    }

    const cacheKey = CacheKeyUtil.forS3FileExists(this.bucketName, relativePath);

    return this.checkFileExistsWithCache(key, cacheKey, async (relPath) => {
      try {
        const command = new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: relPath,
        });

        await this.s3Client!.send(command);
        return true;
      } catch (error: unknown) {
        // Если ошибка 404 - файл не существует (это нормально)
        if (S3ErrorUtil.isNotFoundError(error)) {
          return false;
        }
        // Для других ошибок пробрасываем исключение
        throw error;
      }
    });
  }

  async getFile(key: string): Promise<Buffer | null> {
    if (!this.s3Client) {
      return null;
    }

    try {
      const relativePath = this.extractAndValidatePath(key);
      if (!relativePath) {
        return null;
      }

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: relativePath,
      });

      const response = await this.s3Client.send(command);
      if (response.Body) {
        const chunks: Uint8Array[] = [];
        const stream = response.Body as AsyncIterable<Uint8Array>;
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      }
      return null;
    } catch (error) {
      logger.error('Error getting file from S3', error, { key });
      return null;
    }
  }

  async getFileStream(key: string): Promise<Readable | null> {
    if (!this.s3Client) {
      return null;
    }

    try {
      const relativePath = this.extractAndValidatePath(key);
      if (!relativePath) {
        return null;
      }

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: relativePath,
      });

      const response = await this.s3Client.send(command);
      if (response.Body) {
        const bodyStream = response.Body as AsyncIterable<Uint8Array>;
        const iterator = bodyStream[Symbol.asyncIterator]();

        const readable = new Readable({
          objectMode: false,
          async read(): Promise<void> {
            try {
              const result = await iterator.next();
              const { value, done } = result as IteratorResult<Uint8Array, unknown>;
              if (done) {
                this.push(null);
              } else {
                const buffer = Buffer.from(value);
                if (!this.push(buffer)) {
                  // Поток переполнен, читатель вызовет read() снова
                }
              }
            } catch (error) {
              this.destroy(error as Error);
            }
          },
        });

        readable.on('error', (error) => {
          logger.error('Error in S3 file stream', error, { key });
        });

        return readable;
      }
      return null;
    } catch (error) {
      logger.error('Error getting file stream from S3', error, { key });
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!config.s3.enabled || !this.s3Client) {
      return false;
    }

    const cacheKey = CacheKeyUtil.forS3Availability(this.bucketName);

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        try {
          const testKey = '.health-check';
          const command = new HeadObjectCommand({
            Bucket: this.bucketName,
            Key: testKey,
          });

          await this.s3Client!.send(command);
          return true;
        } catch (error: unknown) {
          if (S3ErrorUtil.isNotFoundError(error)) {
            return true;
          }
          return false;
        }
      },
      5 * 60 * 1000,
    );
  }
}
