"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const types_1 = require("../src/types");
const logger_1 = require("../src/utils/logger");
// Mock dependencies
jest.mock('fs');
jest.mock('chalk', () => ({
    red: (text) => text,
    green: (text) => text,
    blue: (text) => text,
    yellow: (text) => text,
    cyan: (text) => text,
    gray: (text) => text,
    grey: (text) => text
}));
const mockFs = fs;
describe('ConsoleLogger', () => {
    let logger;
    let consoleSpy;
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
        logger = new logger_1.ConsoleLogger(types_1.LogLevel.INFO);
    });
    afterEach(() => {
        // Restore console methods
        Object.values(consoleSpy).forEach(spy => spy.mockRestore());
        jest.clearAllMocks();
    });
    describe('log level filtering', () => {
        it('should log messages at or above the current log level', () => {
            logger = new logger_1.ConsoleLogger(types_1.LogLevel.WARN);
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
            logger = new logger_1.ConsoleLogger(types_1.LogLevel.DEBUG);
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
            logger = new logger_1.ConsoleLogger(types_1.LogLevel.INFO, '/tmp/test.log');
            logger.info('Test message');
            expect(mockFs.appendFileSync).toHaveBeenCalledWith('/tmp/test.log', expect.stringContaining('Test message'));
        });
        it('should create log directory if it does not exist', () => {
            mockFs.existsSync.mockReturnValue(false);
            logger = new logger_1.ConsoleLogger(types_1.LogLevel.INFO, '/tmp/logs/test.log');
            logger.info('Test message');
            expect(mockFs.mkdirSync).toHaveBeenCalledWith('/tmp/logs', { recursive: true });
        });
        it('should handle file write errors gracefully', () => {
            mockFs.appendFileSync.mockImplementation(() => {
                throw new Error('Write failed');
            });
            logger = new logger_1.ConsoleLogger(types_1.LogLevel.INFO, '/tmp/test.log');
            // Should not throw
            expect(() => logger.info('Test message')).not.toThrow();
            expect(consoleSpy.error).toHaveBeenCalledWith('Failed to write to log file:', expect.any(Error));
        });
    });
    describe('error logging with stack traces', () => {
        it('should log error stack traces when log level is DEBUG', () => {
            logger = new logger_1.ConsoleLogger(types_1.LogLevel.DEBUG);
            const error = new Error('Test error');
            logger.error('Error occurred', error);
            expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('Error occurred'));
            expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('Test error'));
        });
        it('should not log error stack traces when log level is below DEBUG', () => {
            logger = new logger_1.ConsoleLogger(types_1.LogLevel.INFO);
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
            logger = new logger_1.ConsoleLogger(types_1.LogLevel.ERROR);
            logger.info('Should not appear');
            expect(consoleSpy.info).not.toHaveBeenCalled();
            logger.setLogLevel(types_1.LogLevel.INFO);
            logger.info('Should appear');
            expect(consoleSpy.info).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=logger.test.js.map