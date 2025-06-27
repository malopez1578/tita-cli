import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { LogLevel } from '../src/types';
import { CommandExecutor } from '../src/utils/command';
import { ConsoleLogger } from '../src/utils/logger';
import { UpdateChecker } from '../src/utils/update-checker';

describe('UpdateChecker', () => {
  let updateChecker: UpdateChecker;
  let mockCommandExecutor: jest.Mocked<CommandExecutor>;
  let logger: ConsoleLogger;
  let tempCacheDir: string;

  // Static test data to avoid dependency on actual package.json version
  const MOCK_CURRENT_VERSION = '1.0.0';

  beforeEach(() => {
    // Create temporary cache directory
    tempCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tita-test-'));
    
    logger = new ConsoleLogger(LogLevel.ERROR);
    mockCommandExecutor = {
      execute: jest.fn(),
      executeSync: jest.fn(),
      gitInit: jest.fn(),
      yarnInstall: jest.fn(),
    } as any;

    updateChecker = new UpdateChecker(
      mockCommandExecutor,
      logger,
      tempCacheDir,
      '@malopez1578/tita-cli'
    );

    // Mock the getCurrentVersion method to return static test data
    jest.spyOn(updateChecker as any, 'getCurrentVersion').mockReturnValue(MOCK_CURRENT_VERSION);
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempCacheDir)) {
      fs.rmSync(tempCacheDir, { recursive: true, force: true });
    }
  });

  describe('compareVersions', () => {
    it('should detect when update is available', async () => {
      // Mock npm view command to return newer version
      mockCommandExecutor.execute.mockResolvedValue({
        stdout: '1.1.0', // Higher than mock current version 1.0.0
        stderr: '',
        exitCode: 0
      });

      const updateInfo = await updateChecker.checkForUpdates(false);
      
      expect(updateInfo.hasUpdate).toBe(true);
      expect(updateInfo.currentVersion).toBe(MOCK_CURRENT_VERSION);
      expect(updateInfo.latestVersion).toBe('1.1.0');
      expect(updateInfo.updateCommand).toContain('@malopez1578/tita-cli@latest');
    });

    it('should handle when no update is available', async () => {
      // Mock npm view command to return same version
      mockCommandExecutor.execute.mockResolvedValue({
        stdout: '1.0.0', // Same as mock current version
        stderr: '',
        exitCode: 0
      });

      const updateInfo = await updateChecker.checkForUpdates(false);
      
      expect(updateInfo.hasUpdate).toBe(false);
      expect(updateInfo.currentVersion).toBe(MOCK_CURRENT_VERSION);
      expect(updateInfo.currentVersion).toBe(updateInfo.latestVersion);
    });

    it('should handle npm command failures gracefully', async () => {
      // Mock npm command to fail
      mockCommandExecutor.execute.mockRejectedValue(new Error('Network error'));

      const updateInfo = await updateChecker.checkForUpdates(false);
      
      expect(updateInfo.hasUpdate).toBe(false);
      expect(updateInfo.currentVersion).toBe(MOCK_CURRENT_VERSION);
      expect(updateInfo.latestVersion).toBe(MOCK_CURRENT_VERSION); // Should fallback to current
    });

    it('should use cached results when available', async () => {
      // First call - should execute npm command
      mockCommandExecutor.execute.mockResolvedValue({
        stdout: '1.0.0', // Same as mock current version
        stderr: '',
        exitCode: 0
      });

      const firstResult = await updateChecker.checkForUpdates(true);
      expect(mockCommandExecutor.execute).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const secondResult = await updateChecker.checkForUpdates(true);
      expect(mockCommandExecutor.execute).toHaveBeenCalledTimes(1); // Still only called once
      
      expect(firstResult).toEqual(secondResult);
      expect(firstResult.currentVersion).toBe(MOCK_CURRENT_VERSION);
    });

    it('should work with different version formats', async () => {
      // Test with different semantic version formats that are clearly newer or same
      const testVersions = [
        { remote: '2.0.0', expectUpdate: true, description: 'major version bump' },
        { remote: '1.0.1', expectUpdate: true, description: 'patch version bump' },
        { remote: '1.1.0', expectUpdate: true, description: 'minor version bump' },
        { remote: '0.9.9', expectUpdate: false, description: 'older version' }
      ];

      for (const testCase of testVersions) {
        mockCommandExecutor.execute.mockResolvedValue({
          stdout: testCase.remote,
          stderr: '',
          exitCode: 0
        });

        const result = await updateChecker.checkForUpdates(false);
        expect(result.hasUpdate).toBe(testCase.expectUpdate);
        expect(result.currentVersion).toBe(MOCK_CURRENT_VERSION);
        expect(result.latestVersion).toBe(testCase.remote);
      }
    });
  });

  describe('displayUpdateNotification', () => {
    it('should not display notification when no update available', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const updateInfo = {
        hasUpdate: false,
        currentVersion: MOCK_CURRENT_VERSION,
        latestVersion: MOCK_CURRENT_VERSION,
        updateCommand: 'npm install -g @malopez1578/tita-cli@latest'
      };

      updateChecker.displayUpdateNotification(updateInfo);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should display notification when update is available', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const updateInfo = {
        hasUpdate: true,
        currentVersion: MOCK_CURRENT_VERSION,
        latestVersion: '1.1.0',
        updateCommand: 'npm install -g @malopez1578/tita-cli@latest'
      };

      updateChecker.displayUpdateNotification(updateInfo);
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls.some(call => 
        call[0].includes('Nueva versión disponible')
      )).toBe(true);
      
      consoleSpy.mockRestore();
    });
  });
});
