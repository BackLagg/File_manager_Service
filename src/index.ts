import { config, validateConfig } from './config';
import { getLogger } from './services/logger.service';
import { StorageInitializerService } from './services/storage-initializer.service';
import { registerDefaultStorageProviders } from './services/storage-providers';
import { createApp } from './app';
import { Express } from 'express';

const logger = getLogger();

let server: ReturnType<Express['listen']> | null = null;

/**
 * Graceful shutdown - корректное завершение работы сервера
 */
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  if (server) {
    return new Promise<void>((resolve) => {
      server?.close(() => {
        logger.info('HTTP server closed');
        resolve();
      });

      setTimeout(() => {
        logger.warn('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    });
  }

  process.exit(0);
}

/**
 * Запускает сервер
 */
async function startServer(): Promise<void> {
  try {
    validateConfig();

    // Регистрируем встроенные провайдеры хранилищ
    registerDefaultStorageProviders();

    await StorageInitializerService.initialize();

    const app = createApp();
    const port = config.server.port;

    server = app.listen(port, () => {
      logger.info('File service started', {
        port,
        storagePath: config.storage.path,
        apiKeyAuth: config.server.apiKey ? 'enabled' : 'disabled',
        nodeEnv: config.server.nodeEnv,
      });
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', reason as Error, { promise });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', error);
      gracefulShutdown('uncaughtException').then(() => process.exit(1));
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();
