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
const types_1 = require("../src/types");
const logger_1 = require("../src/utils/logger");
const update_checker_1 = require("../src/utils/update-checker");
describe('UpdateChecker', () => {
    let updateChecker;
    let mockCommandExecutor;
    let logger;
    let tempCacheDir;
    beforeEach(() => {
        // Create temporary cache directory
        tempCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tita-test-'));
        logger = new logger_1.ConsoleLogger(types_1.LogLevel.ERROR);
        mockCommandExecutor = {
            execute: jest.fn(),
            executeSync: jest.fn(),
            gitInit: jest.fn(),
            yarnInstall: jest.fn(),
        };
        updateChecker = new update_checker_1.UpdateChecker(mockCommandExecutor, logger, tempCacheDir, '@malopez1578/tita-cli');
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
                stdout: '1.3.0', // Higher than current 1.2.0
                stderr: '',
                exitCode: 0
            });
            const updateInfo = await updateChecker.checkForUpdates(false);
            expect(updateInfo.hasUpdate).toBe(true);
            expect(updateInfo.latestVersion).toBe('1.3.0');
            expect(updateInfo.updateCommand).toContain('@malopez1578/tita-cli@latest');
        });
        it('should handle when no update is available', async () => {
            // Mock npm view command to return same version
            mockCommandExecutor.execute.mockResolvedValue({
                stdout: '1.2.0', // Same as current version in package.json
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
                currentVersion: '1.2.0', // Using current version
                latestVersion: '1.2.0',
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
                currentVersion: '1.2.0', // Using current version
                latestVersion: '1.3.0',
                updateCommand: 'npm install -g @malopez1578/tita-cli@latest'
            };
            updateChecker.displayUpdateNotification(updateInfo);
            expect(consoleSpy).toHaveBeenCalled();
            expect(consoleSpy.mock.calls.some(call => call[0].includes('Nueva versión disponible'))).toBe(true);
            consoleSpy.mockRestore();
        });
    });
});
//# sourceMappingURL=update-checker.test.js.map