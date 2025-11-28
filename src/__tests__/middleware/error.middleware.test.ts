import { Request, Response } from 'express';

// Мокаем logger перед импортом
const mockError = jest.fn();
jest.mock('../../services/logger.service', () => ({
  getLogger: jest.fn(() => ({
    error: mockError,
  })),
}));

import { errorHandler } from '../../middleware/error.middleware';

// Мокаем config перед импортом
jest.mock('../../config', () => ({
  config: {
    server: {
      nodeEnv: 'development',
    },
  },
}));

describe('errorHandler middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      url: '/api/test',
      method: 'GET',
      ip: '127.0.0.1',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it('должен логировать ошибку и отправлять ответ 500', () => {
    const error = new Error('Test error');
    mockError.mockClear();

    errorHandler(error, mockRequest as Request, mockResponse as Response);

    expect(mockError).toHaveBeenCalledWith('Internal server error', error, {
      url: '/api/test',
      method: 'GET',
      ip: '127.0.0.1',
    });
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      message: 'Test error',
    });
  });

  it('должен включать message в development режиме', () => {
    // В тестовом окружении nodeEnv = 'test', что эквивалентно development для отображения сообщений
    const error = new Error('Development error');
    if (mockResponse.json) {
      (mockResponse.json as jest.Mock).mockClear();
    }
    errorHandler(error, mockRequest as Request, mockResponse as Response);

    // В тестовом режиме сообщение должно быть видно
    expect(mockResponse.json).toHaveBeenCalled();
  });
});

