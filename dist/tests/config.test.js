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
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const config_1 = require("../src/config");
const types_1 = require("../src/types");
// Mock fs to avoid actual file system operations in tests
jest.mock('fs');
jest.mock('os');
const mockFs = fs;
const mockOs = os;
describe('ConfigManager', () => {
    const mockHomedir = '/mock/home';
    const mockConfigPath = path.join(mockHomedir, '.tita-cli', 'config.json');
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        // Reset singleton instance
        config_1.ConfigManager.instance = undefined;
        // Setup default mocks
        mockOs.homedir.mockReturnValue(mockHomedir);
        mockFs.existsSync.mockReturnValue(false);
        mockFs.mkdirSync.mockImplementation(() => undefined);
        mockFs.writeFileSync.mockImplementation(() => undefined);
    });
    describe('getInstance', () => {
        it('should return the same instance when called multiple times', () => {
            const instance1 = config_1.ConfigManager.getInstance();
            const instance2 = config_1.ConfigManager.getInstance();
            expect(instance1).toBe(instance2);
        });
    });
    describe('getConfig', () => {
        it('should return default config when no config file exists', () => {
            mockFs.existsSync.mockReturnValue(false);
            const configManager = config_1.ConfigManager.getInstance();
            const config = configManager.getConfig();
            expect(config.defaultVendor).toBe('');
            expect(config.defaultAuthor).toBe('');
            expect(config.defaultLicense).toBe('MIT');
            expect(config.logLevel).toBe(types_1.LogLevel.INFO);
        });
        it('should load existing config when file exists', () => {
            const mockConfig = {
                defaultVendor: 'test-vendor',
                defaultAuthor: 'test-author',
                logLevel: types_1.LogLevel.DEBUG
            };
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
            const configManager = config_1.ConfigManager.getInstance();
            const config = configManager.getConfig();
            expect(config.defaultVendor).toBe('test-vendor');
            expect(config.defaultAuthor).toBe('test-author');
            expect(config.logLevel).toBe(types_1.LogLevel.DEBUG);
        });
    });
    describe('updateConfig', () => {
        it('should update config values and save to file', () => {
            mockFs.existsSync.mockReturnValue(false);
            const configManager = config_1.ConfigManager.getInstance();
            configManager.updateConfig({ defaultVendor: 'new-vendor' });
            expect(mockFs.writeFileSync).toHaveBeenCalledWith(mockConfigPath, expect.stringContaining('"defaultVendor": "new-vendor"'));
        });
    });
    describe('setDefaultVendor', () => {
        it('should set default vendor and save config', () => {
            mockFs.existsSync.mockReturnValue(false);
            const configManager = config_1.ConfigManager.getInstance();
            configManager.setDefaultVendor('my-vendor');
            const config = configManager.getConfig();
            expect(config.defaultVendor).toBe('my-vendor');
        });
    });
    describe('addPreferredTemplate', () => {
        it('should add template to preferred list', () => {
            mockFs.existsSync.mockReturnValue(false);
            const configManager = config_1.ConfigManager.getInstance();
            configManager.addPreferredTemplate('react-app');
            const preferredTemplates = configManager.getPreferredTemplates();
            expect(preferredTemplates).toContain('react-app');
        });
        it('should not add duplicate templates', () => {
            mockFs.existsSync.mockReturnValue(false);
            const configManager = config_1.ConfigManager.getInstance();
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
            const configManager = config_1.ConfigManager.getInstance();
            configManager.addPreferredTemplate('react-app');
            configManager.addPreferredTemplate('vue-app');
            configManager.removePreferredTemplate('react-app');
            const preferredTemplates = configManager.getPreferredTemplates();
            expect(preferredTemplates).not.toContain('react-app');
            expect(preferredTemplates).toContain('vue-app');
        });
    });
});
//# sourceMappingURL=config.test.js.map