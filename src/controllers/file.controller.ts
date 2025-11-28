import express, { Response } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as os from 'os';
import { promises as fsPromises } from 'fs';
import { config } from '../config';
import { FileUtil } from '../utils/file.util';
import { PathUtil } from '../utils/path.util';
import { SanitizeUtil } from '../utils/sanitize.util';
import { StorageHelper } from '../utils/storage-helper.util';
import { TempFileUtil } from '../utils/temp-file.util';
import { ControllerErrorUtil } from '../utils/controller-error.util';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { getLogger } from '../services/logger.service';
import { getStorageManager } from '../services/storage-manager.service';

const logger = getLogger();

const tempUploadDir = path.join(os.tmpdir(), 'file-service-uploads');

fsPromises.mkdir(tempUploadDir, { recursive: true }).catch((err) => {
  logger.error('Failed to create temp upload directory', err);
});

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, tempUploadDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `temp-${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: config.storage.maxFileSize,
  },
  fileFilter: ((
    _req: express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
  ) => {
    if (!FileUtil.isExtensionAllowed(file.originalname)) {
      return cb(new Error('File type not allowed'));
    }
    cb(null, true);
  }) as unknown as multer.Options['fileFilter'],
}).single('file');

export class FileController {
  /**
   * Загружает файл
   */
  static async uploadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    upload(req, res, async (err) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Upload error' });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      if (!FileUtil.isSizeValid(file.size)) {
        res.status(400).json({ error: 'File size exceeds limit' });
        return;
      }

      if (!FileUtil.isMimeTypeAllowed(file.mimetype)) {
        res.status(400).json({ error: 'File type not allowed' });
        return;
      }

      const filePath = file.path;
      const isValidContent = await FileUtil.validateFileContent(filePath, file.mimetype);
      if (!isValidContent) {
        await TempFileUtil.safeUnlink(filePath, 'after validation error');
        res.status(400).json({ error: 'File content does not match declared type' });
        return;
      }

      try {
        const body = req.body as { folder?: string; prefix?: string };
        const folder = SanitizeUtil.sanitizeFolderName(body.folder || 'default');
        const prefix = SanitizeUtil.sanitizePrefix(body.prefix || 'file');
        const filename = FileUtil.generateUniqueFilename(file.originalname, prefix);

        const storageService = await StorageHelper.getStorageService();
        const result = await storageService.uploadFile(filePath, filename, folder, file.mimetype);

        await TempFileUtil.safeUnlink(filePath, 'after upload');

        res.json({
          success: true,
          filename: result.filename,
          url: result.url,
          path: result.path,
          size: result.size,
        });
      } catch (error) {
        await TempFileUtil.safeUnlink(filePath, 'after upload error');
        ControllerErrorUtil.handleError(error, res, 'uploading file', {
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        });
      }
    });
  }

  /**
   * Удаляет файл
   */
  static async deleteFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const body = req.body as { path?: string };
    const filePath = body.path;

    if (!filePath) {
      res.status(400).json({ error: 'File path is required' });
      return;
    }

    try {
      const storageService = await StorageHelper.getStorageService();

      const existsResult = await storageService.fileExists(filePath);
      if (!existsResult.exists) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      const result = await storageService.deleteFile(filePath);

      if (result.success) {
        res.json({ success: true, message: result.message });
      } else {
        res.status(404).json({ error: result.message || 'File not found' });
      }
    } catch (error) {
      ControllerErrorUtil.handleError(error, res, 'deleting file', { filePath });
    }
  }

  /**
   * Проверяет существование файла
   */
  static async fileExists(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { path: filePath } = req.query;

    if (!filePath || typeof filePath !== 'string') {
      res.status(400).json({ error: 'File path is required' });
      return;
    }

    try {
      const storageService = await StorageHelper.getStorageService();

      const result = await storageService.fileExists(filePath);

      res.json({ exists: result.exists });
    } catch (error) {
      ControllerErrorUtil.handleError(error, res, 'checking file', { filePath });
    }
  }

  /**
   * Получает файл
   */
  static async getFile(
    req: AuthenticatedRequest & { filePath?: string },
    res: Response,
  ): Promise<void> {
    const filePath = req.filePath || req.params.path;

    if (!filePath) {
      res.status(400).json({ error: 'File path is required' });
      return;
    }

    const normalizedPath = PathUtil.normalizePath(filePath);

    if (!normalizedPath || normalizedPath.length === 0) {
      res.status(400).json({ error: 'Invalid file path' });
      return;
    }

    const fullPath = `/files/${normalizedPath}`;

    try {
      const storageService = await StorageHelper.getStorageService();
      const stream = await storageService.getFileStream(fullPath);

      if (!stream) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      const mimeType = FileUtil.getMimeType(fullPath);

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

      stream.on('error', (error) => {
        logger.error('Error streaming file', error, { filePath: fullPath });
        if (!res.headersSent) {
          ControllerErrorUtil.handleError(error, res, 'streaming file', { filePath: fullPath });
        }
      });

      stream.pipe(res);
    } catch (error) {
      ControllerErrorUtil.handleError(error, res, 'getting file', { filePath: fullPath });
    }
  }

  /**
   * Получает статус хранилища
   */
  static async getStatus(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const storageManager = getStorageManager();
      const storageType = storageManager.getStorageType();
      const storageService = await StorageHelper.getStorageService();

      const available = await storageService.isAvailable();

      res.json({
        available,
        storageType: storageType || 'unknown',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      ControllerErrorUtil.handleError(error, res, 'getting status');
    }
  }
}
