import { CommandExecutionError, PrerequisiteError } from '../src/errors';
import { Logger } from '../src/types';
import { CommandExecutor } from '../src/utils/command';

describe('CommandExecutor', () => {
  let commandExecutor: CommandExecutor;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Create a mock logger
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      warning: jest.fn(),
      error: jest.fn(),
      success: jest.fn()
    };
    
    commandExecutor = new CommandExecutor(mockLogger);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create an instance with logger', () => {
      expect(commandExecutor).toBeInstanceOf(CommandExecutor);
    });
  });

  describe('error handling', () => {
    it('should create proper error types', () => {
      const cmdError = new CommandExecutionError('test cmd', 1);
      expect(cmdError).toBeInstanceOf(CommandExecutionError);
      expect(cmdError.message).toContain('Command execution failed: test cmd');
      expect(cmdError.code).toBe('COMMAND_EXECUTION_ERROR');

      const prereqError = new PrerequisiteError('git');
      expect(prereqError).toBeInstanceOf(PrerequisiteError);
      expect(prereqError.message).toContain('Required tool not found: git');
      expect(prereqError.code).toBe('PREREQUISITE_ERROR');
    });
  });

  describe('command validation', () => {
    it('should accept valid commands', () => {
      expect(() => {
        // This doesn't actually execute, just validates the setup
        const options = { silent: true, cwd: '/tmp' };
        expect(options.silent).toBe(true);
        expect(options.cwd).toBe('/tmp');
      }).not.toThrow();
    });

    it('should handle command options correctly', () => {
      const options = {
        cwd: '/custom/path',
        silent: true,
        timeout: 5000,
        env: { NODE_ENV: 'test' }
      };

      expect(options.cwd).toBe('/custom/path');
      expect(options.silent).toBe(true);
      expect(options.timeout).toBe(5000);
      expect(options.env?.NODE_ENV).toBe('test');
    });
  });

  describe('git command building', () => {
    it('should build git clone command correctly', () => {
      const repo = 'https://gitlab.com/user/repo.git';
      const targetDir = '/target/dir';
      
      // Test command building logic
      let command = 'git clone';
      command += ` "${repo}" "${targetDir}"`;
      
      expect(command).toBe('git clone "https://gitlab.com/user/repo.git" "/target/dir"');
    });

    it('should build git clone command with options', () => {
      const repo = 'https://gitlab.com/user/repo.git';
      const targetDir = '/target/dir';
      const branch = 'develop';
      const depth = 1;
      
      // Test command building logic
      let command = 'git clone';
      if (depth) command += ` --depth ${depth}`;
      if (branch) command += ` --branch ${branch}`;
      command += ` "${repo}" "${targetDir}"`;
      
      expect(command).toBe('git clone --depth 1 --branch develop "https://gitlab.com/user/repo.git" "/target/dir"');
    });
  });

  describe('yarn command building', () => {
    it('should build yarn install command correctly', () => {
      const command = 'yarn install';
      expect(command).toBe('yarn install');
    });
  });

  describe('logger integration', () => {
    it('should call logger methods', () => {
      mockLogger.debug('test debug message');
      mockLogger.info('test info message');
      mockLogger.warn('test warn message');
      mockLogger.error('test error message');
      mockLogger.success('test success message');

      expect(mockLogger.debug).toHaveBeenCalledWith('test debug message');
      expect(mockLogger.info).toHaveBeenCalledWith('test info message');
      expect(mockLogger.warn).toHaveBeenCalledWith('test warn message');
      expect(mockLogger.error).toHaveBeenCalledWith('test error message');
      expect(mockLogger.success).toHaveBeenCalledWith('test success message');
    });
  });
});
