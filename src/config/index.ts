
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { FileSystemError } from '../errors';
import { LogLevel, UserConfig } from '../types';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: UserConfig;
  private configPath: string;

  private constructor() {
    this.configPath = path.join(os.homedir(), '.tita-cli', 'config.json');
    this.config = this.loadConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private getDefaultConfig(): UserConfig {
    return {
      defaultVendor: '',
      defaultAuthor: '',
      defaultLicense: 'MIT',
      preferredTemplates: [],
      cacheDirectory: path.join(os.homedir(), '.tita-cli', 'cache'),
      logLevel: LogLevel.INFO
    };
  }

  private loadConfig(): UserConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf-8');
        const parsedConfig = JSON.parse(configData);
        return { ...this.getDefaultConfig(), ...parsedConfig };
      }
    } catch (error) {
      console.warn(`Failed to load config from ${this.configPath}, using defaults`);
    }
    return this.getDefaultConfig();
  }

  private saveConfig(): void {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      throw new FileSystemError('save config', this.configPath, error);
    }
  }

  getConfig(): UserConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<UserConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  resetConfig(): void {
    this.config = this.getDefaultConfig();
    this.saveConfig();
  }

  getConfigPath(): string {
    return this.configPath;
  }

  // Specific getters for commonly used config values
  getDefaultVendor(): string {
    return this.config.defaultVendor || '';
  }

  getDefaultAuthor(): string {
    return this.config.defaultAuthor || '';
  }

  getCacheDirectory(): string {
    return this.config.cacheDirectory || path.join(os.homedir(), '.tita-cli', 'cache');
  }

  getLogLevel(): LogLevel {
    return this.config.logLevel || LogLevel.INFO;
  }

  getPreferredTemplates(): string[] {
    return this.config.preferredTemplates || [];
  }

  // Specific setters
  setDefaultVendor(vendor: string): void {
    this.updateConfig({ defaultVendor: vendor });
  }

  setDefaultAuthor(author: string): void {
    this.updateConfig({ defaultAuthor: author });
  }

  setLogLevel(level: LogLevel): void {
    this.updateConfig({ logLevel: level });
  }

  addPreferredTemplate(templateName: string): void {
    const current = this.getPreferredTemplates();
    if (!current.includes(templateName)) {
      this.updateConfig({ preferredTemplates: [...current, templateName] });
    }
  }

  removePreferredTemplate(templateName: string): void {
    const current = this.getPreferredTemplates();
    this.updateConfig({ 
      preferredTemplates: current.filter(name => name !== templateName) 
    });
  }
}
