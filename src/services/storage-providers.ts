import { StorageProvider } from './storage-registry.service';
import { getStorageRegistry } from './storage-registry.service';
import { IStorageService } from './storage.interface';
import { S3StorageService } from './s3-storage.service';
import { LocalStorageService } from './local-storage.service';
import { config } from '../config';

/**
 * Провайдер для S3 хранилища
 */
export const s3StorageProvider: StorageProvider = {
  name: 's3',
  priority: 100,
  shouldUse(): boolean {
    return config.s3.enabled;
  },
  create(): IStorageService {
    return new S3StorageService();
  },
};

/**
 * Провайдер для локального хранилища
 * Всегда доступен как fallback
 */
export const localStorageProvider: StorageProvider = {
  name: 'local',
  priority: 0,
  shouldUse(): boolean {
    return true;
  },
  create(): IStorageService {
    return new LocalStorageService();
  },
};

/**
 * Регистрирует все встроенные провайдеры хранилищ
 */
export function registerDefaultStorageProviders(): void {
  const registry = getStorageRegistry();

  registry.register(s3StorageProvider);
  registry.register(localStorageProvider);
}
