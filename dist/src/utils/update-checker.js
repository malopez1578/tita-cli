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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateChecker = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class UpdateChecker {
    constructor(commandExecutor, logger, cacheDirectory, packageName = '@malopez1578/tita-cli') {
        this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        this.commandExecutor = commandExecutor;
        this.logger = logger;
        this.packageName = packageName;
        this.cacheFile = path.join(cacheDirectory, 'update-check.json');
    }
    /**
     * Get current version from package.json
     */
    getCurrentVersion() {
        try {
            // Try multiple possible locations for package.json
            const possiblePaths = [
                path.join(__dirname, '../../package.json'), // From dist/src/utils to root
                path.join(__dirname, '../../../package.json'), // Alternative path
                path.join(process.cwd(), 'package.json') // Current working directory
            ];
            for (const packageJsonPath of possiblePaths) {
                if (fs.existsSync(packageJsonPath)) {
                    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                    if (packageJson.version) {
                        return packageJson.version;
                    }
                }
            }
            throw new Error('package.json not found in any expected location');
        }
        catch (error) {
            this.logger.debug(`Failed to read current version from package.json: ${error}`);
            return '0.0.0';
        }
    }
    /**
     * Get latest version from npm registry
     */
    async getLatestVersion() {
        try {
            const result = await this.commandExecutor.execute(`npm view ${this.packageName} version --json`, { silent: true });
            if (result.exitCode === 0 && result.stdout) {
                // Remove quotes and newlines from npm output
                return result.stdout.trim().replace(/['"]/g, '');
            }
            throw new Error('Failed to get version from npm');
        }
        catch (error) {
            this.logger.debug(`Failed to fetch latest version: ${error}`);
            throw error;
        }
    }
    /**
     * Compare two semantic versions
     */
    compareVersions(current, latest) {
        const currentParts = current.split('.').map(Number);
        const latestParts = latest.split('.').map(Number);
        for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
            const currentPart = currentParts[i] || 0;
            const latestPart = latestParts[i] || 0;
            if (latestPart > currentPart) {
                return true; // Has update
            }
            else if (latestPart < currentPart) {
                return false; // Current is newer (shouldn't happen in normal cases)
            }
        }
        return false; // Versions are equal
    }
    /**
     * Load cached update check result
     */
    loadCachedResult() {
        try {
            if (!fs.existsSync(this.cacheFile)) {
                return null;
            }
            const cached = JSON.parse(fs.readFileSync(this.cacheFile, 'utf-8'));
            const now = Date.now();
            if (now - cached.timestamp > this.cacheTTL) {
                // Cache expired
                return null;
            }
            return cached.data;
        }
        catch (error) {
            this.logger.debug(`Failed to load cached update result: ${error}`);
            return null;
        }
    }
    /**
     * Save update check result to cache
     */
    saveCachedResult(updateInfo) {
        try {
            const cacheData = {
                timestamp: Date.now(),
                data: updateInfo
            };
            // Ensure cache directory exists
            const cacheDir = path.dirname(this.cacheFile);
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }
            fs.writeFileSync(this.cacheFile, JSON.stringify(cacheData, null, 2));
        }
        catch (error) {
            this.logger.debug(`Failed to save cached update result: ${error}`);
        }
    }
    /**
     * Check for updates (with caching)
     */
    async checkForUpdates(useCache = true) {
        const currentVersion = this.getCurrentVersion();
        // Try to use cached result first
        if (useCache) {
            const cached = this.loadCachedResult();
            if (cached && cached.currentVersion === currentVersion) {
                this.logger.debug('Using cached update check result');
                return cached;
            }
        }
        try {
            this.logger.debug('Checking for updates...');
            const latestVersion = await this.getLatestVersion();
            const hasUpdate = this.compareVersions(currentVersion, latestVersion);
            const updateInfo = {
                hasUpdate,
                currentVersion,
                latestVersion,
                updateCommand: `npm install -g ${this.packageName}@latest`
            };
            // Cache the result
            this.saveCachedResult(updateInfo);
            return updateInfo;
        }
        catch (error) {
            this.logger.debug(`Update check failed: ${error}`);
            // Return current version info even if check failed
            return {
                hasUpdate: false,
                currentVersion,
                latestVersion: currentVersion,
                updateCommand: `npm install -g ${this.packageName}@latest`
            };
        }
    }
    /**
     * Display update notification
     */
    displayUpdateNotification(updateInfo) {
        if (!updateInfo.hasUpdate) {
            return;
        }
        console.log('\n' + chalk_1.default.yellow('┌─────────────────────────────────────────────────────┐'));
        console.log(chalk_1.default.yellow('│  🔔 Nueva versión disponible!                       │'));
        console.log(chalk_1.default.yellow('│                                                     │'));
        console.log(chalk_1.default.yellow('│') + `  Versión actual: ${chalk_1.default.red(updateInfo.currentVersion)}                             `.slice(0, 52) + chalk_1.default.yellow('│'));
        console.log(chalk_1.default.yellow('│') + `  Última versión: ${chalk_1.default.green(updateInfo.latestVersion)}                             `.slice(0, 52) + chalk_1.default.yellow('│'));
        console.log(chalk_1.default.yellow('│                                                     │'));
        console.log(chalk_1.default.yellow('│') + chalk_1.default.cyan('  Para actualizar, ejecuta:                          ') + chalk_1.default.yellow('│'));
        console.log(chalk_1.default.yellow('│') + `  ${chalk_1.default.white(updateInfo.updateCommand)}                             `.slice(0, 52) + chalk_1.default.yellow('│'));
        console.log(chalk_1.default.yellow('│                                                     │'));
        console.log(chalk_1.default.yellow('│') + chalk_1.default.gray('  Alternativamente con yarn:                         ') + chalk_1.default.yellow('│'));
        console.log(chalk_1.default.yellow('│') + `  ${chalk_1.default.white('yarn global add ' + this.packageName + '@latest')}                             `.slice(0, 52) + chalk_1.default.yellow('│'));
        console.log(chalk_1.default.yellow('└─────────────────────────────────────────────────────┘'));
        console.log('');
    }
    /**
     * Show update info command
     */
    async showUpdateInfo() {
        console.log(chalk_1.default.cyan('🔍 Verificando actualizaciones...'));
        const updateInfo = await this.checkForUpdates(false); // Force fresh check
        if (updateInfo.hasUpdate) {
            this.displayUpdateNotification(updateInfo);
        }
        else {
            console.log(chalk_1.default.green('✅ Ya tienes la versión más reciente instalada!'));
            console.log(chalk_1.default.gray(`   Versión actual: ${updateInfo.currentVersion}`));
        }
    }
}
exports.UpdateChecker = UpdateChecker;
//# sourceMappingURL=update-checker.js.map