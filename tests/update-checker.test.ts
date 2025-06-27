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
        stdout: '1.2.0',
        stderr: '',
        exitCode: 0
      });

      const updateInfo = await updateChecker.checkForUpdates(false);
      
      expect(updateInfo.hasUpdate).toBe(true);
      expect(updateInfo.latestVersion).toBe('1.2.0');
      expect(updateInfo.updateCommand).toContain('@malopez1578/tita-cli@latest');
    });

    it('should handle when no update is available', async () => {
      // Mock npm view command to return same version
      mockCommandExecutor.execute.mockResolvedValue({
        stdout: '1.1.9', // Using current version from package.json
        stderr: '',
        exitCode: 0
      });

      const updateInfo = await updateChecker.checkForUpdates(false);
      
      expect(updateInfo.hasUpdate).toBe(false);
      expect(updateInfo.currentVersion).toBe(updateInfo.latestVersion);
    });

    it('should handle npm command failures gracefully', async () => {
      // Mock npm command to fail
      mockCommandExecutor.execute.mockRejectedValue(new Error('Network error'));

      const updateInfo = await updateChecker.checkForUpdates(false);
      
      expect(updateInfo.hasUpdate).toBe(false);
      expect(updateInfo.currentVersion).toBeDefined();
    });

    it('should use cached results when available', async () => {
      // First call - should execute npm command
      mockCommandExecutor.execute.mockResolvedValue({
        stdout: '1.2.0',
        stderr: '',
        exitCode: 0
      });

      const firstResult = await updateChecker.checkForUpdates(true);
      expect(mockCommandExecutor.execute).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const secondResult = await updateChecker.checkForUpdates(true);
      expect(mockCommandExecutor.execute).toHaveBeenCalledTimes(1); // Still only called once
      
      expect(firstResult).toEqual(secondResult);
    });
  });

  describe('displayUpdateNotification', () => {
    it('should not display notification when no update available', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const updateInfo = {
        hasUpdate: false,
        currentVersion: '1.1.9', // Using current version
        latestVersion: '1.1.9',
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
        currentVersion: '1.1.9', // Using current version
        latestVersion: '1.2.0',
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
