import { Response, NextFunction } from 'express';
import { apiKeyAuth, AuthenticatedRequest } from '../../middleware/auth.middleware';

// Мокаем config перед импортом
jest.mock('../../config', () => ({
  config: {
    server: {
      apiKey: 'test-api-key-123',
    },
  },
}));

describe('apiKeyAuth middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  it('должен пропускать запрос с валидным API ключом', () => {
    mockRequest.headers!['x-api-key'] = 'test-api-key-123';

    apiKeyAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('должен отклонять запрос без API ключа', () => {
    apiKeyAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'API key is required' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('должен отклонять запрос с невалидным API ключом', () => {
    mockRequest.headers!['x-api-key'] = 'wrong-key';

    apiKeyAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid API key' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('должен устанавливать apiKey в request', () => {
    mockRequest.headers!['x-api-key'] = 'test-api-key-123';

    apiKeyAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

    expect(mockRequest.apiKey).toBe('test-api-key-123');
  });

  it('должен защищать от timing attacks (разные длины ключей)', () => {
    const start1 = Date.now();
    mockRequest.headers!['x-api-key'] = 'short';
    apiKeyAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);
    const time1 = Date.now() - start1;

    const start2 = Date.now();
    mockRequest.headers!['x-api-key'] = 'very-long-key-that-should-take-different-time';
    apiKeyAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);
    const time2 = Date.now() - start2;

    // Время должно быть примерно одинаковым (защита от timing attacks)
    // Допускаем разницу до 10ms из-за погрешности измерения
    expect(Math.abs(time1 - time2)).toBeLessThan(10);
  });
});

