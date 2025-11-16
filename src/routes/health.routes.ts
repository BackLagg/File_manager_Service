import { Express } from 'express';

/**
 * Настраивает роуты для health check
 */
export function setupHealthRoutes(app: Express): void {
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
}
