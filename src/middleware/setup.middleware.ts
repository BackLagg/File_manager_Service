import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { config } from '../config';

/**
 * Middleware для принудительного использования HTTPS в production
 */
function enforceHttpsMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  if (config.server.enforceHttps && config.server.nodeEnv === 'production') {
    const isHttps = req.headers['x-forwarded-proto'] === 'https' || req.protocol === 'https';

    if (!isHttps) {
      return res.redirect(301, `https://${req.get('host')}${req.url}`);
    }
  }
  next();
}

/**
 * Настраивает базовые middleware для приложения
 */
export function setupMiddleware(app: Express): void {
  app.use(enforceHttpsMiddleware);
  app.use(compression());

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(
    cors({
      origin: config.server.cors.getOrigins(),
      credentials: false,
      methods: ['GET', 'POST', 'DELETE', 'HEAD', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-API-Key'],
    }),
  );

  app.use(express.json({ limit: config.server.bodyParser.jsonLimit }));
  app.use(express.urlencoded({ extended: true, limit: config.server.bodyParser.urlencodedLimit }));

  const limiter = rateLimit({
    windowMs: config.server.rateLimit.windowMs,
    max: config.server.rateLimit.max,
    message: 'Too many requests from this IP, please try again later.',
  });

  app.use('/api/', limiter);
}
