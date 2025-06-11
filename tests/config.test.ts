import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ConfigManager } from '../src/config';
import { LogLevel } from '../src/types';

// Mock fs to avoid actual file system operations in tests
jest.mock('fs');
jest.mock('os');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockOs = os as jest.Mocked<typeof os>;

describe('ConfigManager', () => {
  const mockHomedir = '/mock/home';
  const mockConfigPath = path.join(mockHomedir, '.tita-cli', 'config.json');

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset singleton instance
    (ConfigManager as any).instance = undefined;
    
    // Setup default mocks
    mockOs.homedir.mockReturnValue(mockHomedir);
    mockFs.existsSync.mockReturnValue(false);
    mockFs.mkdirSync.mockImplementation(() => undefined);
    mockFs.writeFileSync.mockImplementation(() => undefined);
  });

  describe('getInstance', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = ConfigManager.getInstance();
      const instance2 = ConfigManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('getConfig', () => {
    it('should return default config when no config file exists', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const configManager = ConfigManager.getInstance();
      const config = configManager.getConfig();
      
      expect(config.defaultVendor).toBe('');
      expect(config.defaultAuthor).toBe('');
      expect(config.defaultLicense).toBe('MIT');
      expect(config.logLevel).toBe(LogLevel.INFO);
    });

    it('should load existing config when file exists', () => {
      const mockConfig = {
        defaultVendor: 'test-vendor',
        defaultAuthor: 'test-author',
        logLevel: LogLevel.DEBUG
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      
      const configManager = ConfigManager.getInstance();
      const config = configManager.getConfig();
      
      expect(config.defaultVendor).toBe('test-vendor');
      expect(config.defaultAuthor).toBe('test-author');
      expect(config.logLevel).toBe(LogLevel.DEBUG);
    });
  });

  describe('updateConfig', () => {
    it('should update config values and save to file', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const configManager = ConfigManager.getInstance();
      configManager.updateConfig({ defaultVendor: 'new-vendor' });
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        expect.stringContaining('"defaultVendor": "new-vendor"')
      );
    });
  });

  describe('setDefaultVendor', () => {
    it('should set default vendor and save config', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const configManager = ConfigManager.getInstance();
      configManager.setDefaultVendor('my-vendor');
      
      const config = configManager.getConfig();
      expect(config.defaultVendor).toBe('my-vendor');
    });
  });

  describe('addPreferredTemplate', () => {
    it('should add template to preferred list', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const configManager = ConfigManager.getInstance();
      configManager.addPreferredTemplate('react-app');
      
      const preferredTemplates = configManager.getPreferredTemplates();
      expect(preferredTemplates).toContain('react-app');
    });

    it('should not add duplicate templates', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const configManager = ConfigManager.getInstance();
      configManager.addPreferredTemplate('react-app');
      configManager.addPreferredTemplate('react-app');
      
      const preferredTemplates = configManager.getPreferredTemplates();
      const reactAppCount = preferredTemplates.filter(t => t === 'react-app').length;
      expect(reactAppCount).toBe(1);
    });
  });

  describe('removePreferredTemplate', () => {
    it('should remove template from preferred list', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const configManager = ConfigManager.getInstance();
      configManager.addPreferredTemplate('react-app');
      configManager.addPreferredTemplate('vue-app');
      configManager.removePreferredTemplate('react-app');
      
      const preferredTemplates = configManager.getPreferredTemplates();
      expect(preferredTemplates).not.toContain('react-app');
      expect(preferredTemplates).toContain('vue-app');
    });
  });
});
