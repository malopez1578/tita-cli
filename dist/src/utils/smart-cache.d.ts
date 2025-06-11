import { Logger } from '../types';
import { OptimizedCloner } from './optimized-cloner';
interface CacheMetadata {
    lastUpdated: number;
    gitUrl: string;
    size: number;
    hits: number;
    lastAccessed: number;
}
interface CacheStats {
    totalTemplates: number;
    totalSize: string;
    oldestCache: string;
    mostUsed: string;
    hitRate: number;
}
export declare class SmartCache {
    private readonly cacheDir;
    private readonly metadataFile;
    private readonly logger;
    private readonly cloner;
    private readonly ttlHours;
    private readonly maxCacheSizeMB;
    constructor(logger: Logger, cloner: OptimizedCloner, ttlHours?: number, maxCacheSizeMB?: number);
    private ensureCacheDirectory;
    getTemplate(templateName: string, gitUrl: string): Promise<string>;
    private isCacheValid;
    private updateCache;
    private enforcesCacheLimits;
    private cleanLeastUsedCache;
    private loadMetadata;
    private saveMetadata;
    private saveMetadataObject;
    private updateHitCount;
    private getDirectorySize;
    private getTotalCacheSizeMB;
    private sanitizeTemplateName;
    cleanOldCache(maxAgeHours?: number): Promise<number>;
    clearAll(): Promise<void>;
    getCacheStats(): CacheStats;
    hasTemplate(templateName: string): boolean;
    isTemplateValid(templateName: string, gitUrl: string): Promise<boolean>;
    getMetadata(): Record<string, CacheMetadata>;
}
export {};
//# sourceMappingURL=smart-cache.d.ts.map