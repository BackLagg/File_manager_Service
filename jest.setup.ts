// Глобальная настройка для тестов
process.env.NODE_ENV = 'test';
process.env.FILE_API_KEY = 'test-api-key';
process.env.S3_ENABLED = 'false';
process.env.STORAGE_PATH = './test-storage';
process.env.MAX_FILE_SIZE = '10485760'; // 10MB для тестов
process.env.ALLOWED_EXTENSIONS = 'jpg,png,pdf,txt';
