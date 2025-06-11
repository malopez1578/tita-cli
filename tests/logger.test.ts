import * as fs from 'fs';
import { LogLevel } from '../src/types';
import { ConsoleLogger } from '../src/utils/logger';

// Mock dependencies
jest.mock('fs');
jest.mock('chalk', () => ({
  red: (text: string) => text,
  green: (text: string) => text,
  blue: (text: string) => text,
  yellow: (text: string) => text,
  cyan: (text: string) => text,
  gray: (text: string) => text,
  grey: (text: string) => text
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('ConsoleLogger', () => {
  let logger: ConsoleLogger;
  let consoleSpy: {
    log: jest.SpyInstance;
    info: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
    debug: jest.SpyInstance;
  };

  beforeEach(() => {
    // Mock console methods
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      info: jest.spyOn(console, 'info').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
      debug: jest.spyOn(console, 'debug').mockImplementation()
    };

    // Mock fs methods
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockImplementation(() => undefined);
    mockFs.appendFileSync.mockImplementation(() => undefined);

    logger = new ConsoleLogger(LogLevel.INFO);
  });

  afterEach(() => {
    // Restore console methods
    Object.values(consoleSpy).forEach(spy => spy.mockRestore());
    jest.clearAllMocks();
  });

  describe('log level filtering', () => {
    it('should log messages at or above the current log level', () => {
      logger = new ConsoleLogger(LogLevel.WARN);
      
      logger.error('Error message');
      logger.warn('Warning message');
      logger.info('Info message');
      logger.debug('Debug message');
      
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('Error message'));
      expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('Warning message'));
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });

    it('should log all messages when log level is DEBUG', () => {
      logger = new ConsoleLogger(LogLevel.DEBUG);
      
      logger.error('Error message');
      logger.warn('Warning message');
      logger.info('Info message');
      logger.debug('Debug message');
      
      expect(consoleSpy.error).toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.info).toHaveBeenCalled();
      expect(consoleSpy.debug).toHaveBeenCalled();
    });
  });

  describe('file logging', () => {
    it('should write logs to file when log file is specified', () => {
      logger = new ConsoleLogger(LogLevel.INFO, '/tmp/test.log');
      
      logger.info('Test message');
      
      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        '/tmp/test.log',
        expect.stringContaining('Test message')
      );
    });

    it('should create log directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      logger = new ConsoleLogger(LogLevel.INFO, '/tmp/logs/test.log');
      
      logger.info('Test message');
      
      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/tmp/logs', { recursive: true });
    });

    it('should handle file write errors gracefully', () => {
      mockFs.appendFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });
      
      logger = new ConsoleLogger(LogLevel.INFO, '/tmp/test.log');
      
      // Should not throw
      expect(() => logger.info('Test message')).not.toThrow();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Failed to write to log file:',
        expect.any(Error)
      );
    });
  });

  describe('error logging with stack traces', () => {
    it('should log error stack traces when log level is DEBUG', () => {
      logger = new ConsoleLogger(LogLevel.DEBUG);
      const error = new Error('Test error');
      
      logger.error('Error occurred', error);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('Error occurred'));
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('Test error'));
    });

    it('should not log error stack traces when log level is below DEBUG', () => {
      logger = new ConsoleLogger(LogLevel.INFO);
      const error = new Error('Test error');
      
      logger.error('Error occurred', error);
      
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('Error occurred'));
    });
  });

  describe('success logging', () => {
    it('should log success messages with green color', () => {
      logger.success('Operation completed');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('Operation completed'));
    });
  });

  describe('setLogLevel', () => {
    it('should update the log level', () => {
      logger = new ConsoleLogger(LogLevel.ERROR);
      
      logger.info('Should not appear');
      expect(consoleSpy.info).not.toHaveBeenCalled();
      
      logger.setLogLevel(LogLevel.INFO);
      logger.info('Should appear');
      expect(consoleSpy.info).toHaveBeenCalled();
    });
  });
});
