import { Logger } from '../types';
import { CommandExecutor } from './command';
export interface UpdateInfo {
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion: string;
    updateCommand: string;
}
export declare class UpdateChecker {
    private readonly commandExecutor;
    private readonly logger;
    private readonly packageName;
    private readonly cacheFile;
    private readonly cacheTTL;
    constructor(commandExecutor: CommandExecutor, logger: Logger, cacheDirectory: string, packageName?: string);
    /**
     * Get current version from package.json
     */
    private getCurrentVersion;
    /**
     * Get latest version from npm registry
     */
    private getLatestVersion;
    /**
     * Compare two semantic versions
     */
    private compareVersions;
    /**
     * Load cached update check result
     */
    private loadCachedResult;
    /**
     * Save update check result to cache
     */
    private saveCachedResult;
    /**
     * Check for updates (with caching)
     */
    checkForUpdates(useCache?: boolean): Promise<UpdateInfo>;
    /**
     * Display update notification
     */
    displayUpdateNotification(updateInfo: UpdateInfo): void;
    /**
     * Show update info command
     */
    showUpdateInfo(): Promise<void>;
}
//# sourceMappingURL=update-checker.d.ts.map