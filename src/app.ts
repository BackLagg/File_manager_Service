import express, { Express } from 'express';
import { setupMiddleware } from './middleware/setup.middleware';
import { errorHandler } from './middleware/error.middleware';
import { setupFileRoutes } from './routes/file.routes';
import { setupHealthRoutes } from './routes/health.routes';

/**
 * Создает и настраивает Express приложение
 */
export function createApp(): Express {
  const app = express();

  // Настраиваем middleware
  setupMiddleware(app);

  // Настраиваем роуты
  setupFileRoutes(app);
  setupHealthRoutes(app);

  // Настраиваем обработку ошибок (должен быть последним)
  app.use(errorHandler);

  return app;
}
