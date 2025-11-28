import express from 'express';
import { apiKeyAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { FileController } from '../controllers/file.controller';
import { PathUtil } from '../utils/path.util';

/**
 * Настраивает роуты для работы с файлами
 */
export function setupFileRoutes(app: express.Express): void {
  app.use('/files', async (req, res, next) => {
    try {
      const cleanPath = req.path.startsWith('/') ? req.path.substring(1) : req.path;

      if (!cleanPath || !PathUtil.isValidPath(cleanPath)) {
        res.status(400).json({ error: 'Invalid file path' });
        return;
      }

      const reqWithPath = req as AuthenticatedRequest & { filePath: string };
      reqWithPath.filePath = cleanPath;
      await FileController.getFile(reqWithPath, res);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/upload', apiKeyAuth, FileController.uploadFile);
  app.delete('/api/delete', apiKeyAuth, FileController.deleteFile);
  app.get('/api/exists', apiKeyAuth, FileController.fileExists);
  app.get('/api/status', apiKeyAuth, FileController.getStatus);
}
