import { Response } from 'express';

// Мокаем logger перед импортом
const mockError = jest.fn();
jest.mock('../../services/logger.service', () => ({
  getLogger: jest.fn(() => ({
    error: mockError,
  })),
}));

import { ControllerErrorUtil } from '../../utils/controller-error.util';

// Мокаем config перед импортом
jest.mock('../../config', () => ({
  config: {
    server: {
      nodeEnv: 'test',
    },
  },
}));

describe('ControllerErrorUtil', () => {
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('handleError', () => {
    beforeEach(() => {
      mockError.mockClear();
    });

    it('должен логировать ошибку и отправлять ответ', () => {
      const error = new Error('Test error');

      ControllerErrorUtil.handleError(error, mockResponse as Response, 'testing');

      expect(mockError).toHaveBeenCalledWith('Error testing', error, undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('должен включать контекстные данные в лог', () => {
      const error = new Error('Test error');
      const contextData = { file: 'test.txt', size: 1024 };

      ControllerErrorUtil.handleError(error, mockResponse as Response, 'testing', contextData);

      expect(mockError).toHaveBeenCalledWith('Error testing', error, contextData);
    });

    it('должен обрабатывать не-Error объекты', () => {
      const error = 'String error';

      ControllerErrorUtil.handleError(error, mockResponse as Response, 'testing');

      expect(mockError).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('должен обрабатывать null/undefined', () => {
      ControllerErrorUtil.handleError(null, mockResponse as Response, 'testing');
      ControllerErrorUtil.handleError(undefined, mockResponse as Response, 'testing');

      expect(mockError).toHaveBeenCalledTimes(2);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });
});

