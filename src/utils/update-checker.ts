import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../types';
import { CommandExecutor } from './command';

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  updateCommand: string;
}

export class UpdateChecker {
  private readonly commandExecutor: CommandExecutor;
  private readonly logger: Logger;
  private readonly packageName: string;
  private readonly cacheFile: string;
  private readonly cacheTTL: number = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor(
    commandExecutor: CommandExecutor,
    logger: Logger,
    cacheDirectory: string,
    packageName: string = '@malopez1578/tita-cli'
  ) {
    this.commandExecutor = commandExecutor;
    this.logger = logger;
    this.packageName = packageName;
    this.cacheFile = path.join(cacheDirectory, 'update-check.json');
  }

  /**
   * Get current version from package.json
   */
  private getCurrentVersion(): string {
    try {
      // Try multiple possible locations for package.json
      const possiblePaths = [
        path.join(__dirname, '../../package.json'),     // From dist/src/utils to root
        path.join(__dirname, '../../../package.json'),  // Alternative path
        path.join(process.cwd(), 'package.json')        // Current working directory
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
    } catch (error) {
      this.logger.debug(`Failed to read current version from package.json: ${error}`);
      return '0.0.0';
    }
  }

  /**
   * Get latest version from npm registry
   */
  private async getLatestVersion(): Promise<string> {
    try {
      const result = await this.commandExecutor.execute(
        `npm view ${this.packageName} version --json`,
        { silent: true }
      );
      
      if (result.exitCode === 0 && result.stdout) {
        // Remove quotes and newlines from npm output
        return result.stdout.trim().replace(/['"]/g, '');
      }
      
      throw new Error('Failed to get version from npm');
    } catch (error) {
      this.logger.debug(`Failed to fetch latest version: ${error}`);
      throw error;
    }
  }

  /**
   * Compare two semantic versions
   */
  private compareVersions(current: string, latest: string): boolean {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);
    
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;
      
      if (latestPart > currentPart) {
        return true; // Has update
      } else if (latestPart < currentPart) {
        return false; // Current is newer (shouldn't happen in normal cases)
      }
    }
    
    return false; // Versions are equal
  }

  /**
   * Load cached update check result
   */
  private loadCachedResult(): UpdateInfo | null {
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
    } catch (error) {
      this.logger.debug(`Failed to load cached update result: ${error}`);
      return null;
    }
  }

  /**
   * Save update check result to cache
   */
  private saveCachedResult(updateInfo: UpdateInfo): void {
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
    } catch (error) {
      this.logger.debug(`Failed to save cached update result: ${error}`);
    }
  }

  /**
   * Check for updates (with caching)
   */
  async checkForUpdates(useCache: boolean = true): Promise<UpdateInfo> {
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
      
      const updateInfo: UpdateInfo = {
        hasUpdate,
        currentVersion,
        latestVersion,
        updateCommand: `npm install -g ${this.packageName}@latest`
      };
      
      // Cache the result
      this.saveCachedResult(updateInfo);
      
      return updateInfo;
    } catch (error) {
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
  displayUpdateNotification(updateInfo: UpdateInfo): void {
    if (!updateInfo.hasUpdate) {
      return;
    }

    console.log('\n' + chalk.yellow('┌─────────────────────────────────────────────────────┐'));
    console.log(chalk.yellow('│  🔔 Nueva versión disponible!                       │'));
    console.log(chalk.yellow('│                                                     │'));
    console.log(chalk.yellow('│') + `  Versión actual: ${chalk.red(updateInfo.currentVersion)}                             `.slice(0, 52) + chalk.yellow('│'));
    console.log(chalk.yellow('│') + `  Última versión: ${chalk.green(updateInfo.latestVersion)}                             `.slice(0, 52) + chalk.yellow('│'));
    console.log(chalk.yellow('│                                                     │'));
    console.log(chalk.yellow('│') + chalk.cyan('  Para actualizar, ejecuta:                          ') + chalk.yellow('│'));
    console.log(chalk.yellow('│') + `  ${chalk.white(updateInfo.updateCommand)}                             `.slice(0, 52) + chalk.yellow('│'));
    console.log(chalk.yellow('│                                                     │'));
    console.log(chalk.yellow('│') + chalk.gray('  Alternativamente con yarn:                         ') + chalk.yellow('│'));
    console.log(chalk.yellow('│') + `  ${chalk.white('yarn global add ' + this.packageName + '@latest')}                             `.slice(0, 52) + chalk.yellow('│'));
    console.log(chalk.yellow('└─────────────────────────────────────────────────────┘'));
    console.log('');
  }

  /**
   * Show update info command
   */
  async showUpdateInfo(): Promise<void> {
    console.log(chalk.cyan('🔍 Verificando actualizaciones...'));
    
    const updateInfo = await this.checkForUpdates(false); // Force fresh check
    
    if (updateInfo.hasUpdate) {
      this.displayUpdateNotification(updateInfo);
    } else {
      console.log(chalk.green('✅ Ya tienes la versión más reciente instalada!'));
      console.log(chalk.gray(`   Versión actual: ${updateInfo.currentVersion}`));
    }
  }
}
