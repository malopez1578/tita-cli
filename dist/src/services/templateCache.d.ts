import { Logger, TemplateConfig } from '../types';
export declare class TemplateCache {
    private cacheDir;
    private indexPath;
    private cacheIndex;
    private logger;
    private maxAge;
    private maxSize;
    constructor(cacheDir: string, logger: Logger, maxAge?: number, // 24 hours
    maxSize?: number);
    private ensureCacheDirectory;
    private loadIndex;
    private saveIndex;
    private generateCacheKey;
    private getCachePath;
    private isExpired;
    private calculateCacheSize;
    private getDirectorySize;
    private cleanup;
    has(template: TemplateConfig): boolean;
    get(template: TemplateConfig): string | null;
    set(template: TemplateConfig, sourcePath: string): string;
    private copyDirectory;
    remove(cacheKeyOrTemplate: string | TemplateConfig): boolean;
    clear(): void;
    getStats(): {
        count: number;
        size: number;
        oldestEntry?: Date;
        newestEntry?: Date;
    };
    list(): Array<{
        template: TemplateConfig;
        cachedAt: Date;
        lastAccessed: Date;
        size: number;
    }>;
}
//# sourceMappingURL=templateCache.d.ts.map