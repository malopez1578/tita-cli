import { LogLevel, UserConfig } from '../types';
export declare class ConfigManager {
    private static instance;
    private config;
    private configPath;
    private constructor();
    static getInstance(): ConfigManager;
    private getDefaultConfig;
    private loadConfig;
    private saveConfig;
    getConfig(): UserConfig;
    updateConfig(updates: Partial<UserConfig>): void;
    resetConfig(): void;
    getConfigPath(): string;
    getDefaultVendor(): string;
    getDefaultAuthor(): string;
    getCacheDirectory(): string;
    getLogLevel(): LogLevel;
    getPreferredTemplates(): string[];
    setDefaultVendor(vendor: string): void;
    setDefaultAuthor(author: string): void;
    setLogLevel(level: LogLevel): void;
    addPreferredTemplate(templateName: string): void;
    removePreferredTemplate(templateName: string): void;
}
//# sourceMappingURL=index.d.ts.map