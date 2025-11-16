import express from 'express';
import { apiKeyAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { FileController } from '../controllers/file.controller';

/**
 * Настраивает роуты для работы с файлами
 */
export function setupFileRoutes(app: express.Express): void {
  app.use('/files', (req, res) => {
    const path = req.path.replace('/files', '') || req.url.replace('/files', '');
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const reqWithPath = req as AuthenticatedRequest & { filePath: string };
    reqWithPath.filePath = cleanPath;
    FileController.getFile(reqWithPath, res);
  });

  app.post('/api/upload', apiKeyAuth, FileController.uploadFile);
  app.delete('/api/delete', apiKeyAuth, FileController.deleteFile);
  app.get('/api/exists', apiKeyAuth, FileController.fileExists);
  app.get('/api/status', apiKeyAuth, FileController.getStatus);
}
