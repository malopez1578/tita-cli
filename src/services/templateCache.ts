
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { FileSystemError } from '../errors';
import { Logger, TemplateConfig } from '../types';

interface CacheEntry {
  template: TemplateConfig;
  cachedAt: number;
  lastAccessed: number;
  path: string;
  hash: string;
}

interface CacheIndex {
  entries: Record<string, CacheEntry>;
  version: string;
}

export class TemplateCache {
  private cacheDir: string;
  private indexPath: string;
  private cacheIndex: CacheIndex;
  private logger: Logger;
  private maxAge: number; // Cache max age in milliseconds
  private maxSize: number; // Max cache size in bytes

  constructor(
    cacheDir: string, 
    logger: Logger,
    maxAge: number = 24 * 60 * 60 * 1000, // 24 hours
    maxSize: number = 500 * 1024 * 1024 // 500 MB
  ) {
    this.cacheDir = cacheDir;
    this.indexPath = path.join(cacheDir, 'index.json');
    this.logger = logger;
    this.maxAge = maxAge;
    this.maxSize = maxSize;
    this.cacheIndex = this.loadIndex();
    this.ensureCacheDirectory();
  }

  private ensureCacheDirectory(): void {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
    } catch (error) {
      throw new FileSystemError('create cache directory', this.cacheDir, error);
    }
  }

  private loadIndex(): CacheIndex {
    try {
      if (fs.existsSync(this.indexPath)) {
        const indexData = fs.readFileSync(this.indexPath, 'utf-8');
        return JSON.parse(indexData);
      }
    } catch (error) {
      this.logger.warn(`Failed to load cache index, creating new one: ${error}`);
    }

    return {
      entries: {},
      version: '1.0.0'
    };
  }

  private saveIndex(): void {
    try {
      fs.writeFileSync(this.indexPath, JSON.stringify(this.cacheIndex, null, 2));
    } catch (error) {
      throw new FileSystemError('save cache index', this.indexPath, error);
    }
  }

  private generateCacheKey(template: TemplateConfig): string {
    const data = `${template.name}:${template.gitlabUrl}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private getCachePath(cacheKey: string): string {
    return path.join(this.cacheDir, cacheKey);
  }

  private isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    return (now - entry.cachedAt) > this.maxAge;
  }

  private calculateCacheSize(): number {
    let totalSize = 0;
    for (const entry of Object.values(this.cacheIndex.entries)) {
      try {
        if (fs.existsSync(entry.path)) {
          const stats = fs.statSync(entry.path);
          if (stats.isDirectory()) {
            totalSize += this.getDirectorySize(entry.path);
          } else {
            totalSize += stats.size;
          }
        }
      } catch (error) {
        this.logger.debug(`Failed to calculate size for ${entry.path}: ${error}`);
      }
    }
    return totalSize;
  }

  private getDirectorySize(dirPath: string): number {
    let totalSize = 0;
    try {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
          totalSize += this.getDirectorySize(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      this.logger.debug(`Failed to calculate directory size for ${dirPath}: ${error}`);
    }
    return totalSize;
  }

  private cleanup(): void {
    const entries = Object.entries(this.cacheIndex.entries);
    const now = Date.now();

    // Remove expired entries
    const expiredEntries = entries.filter(([, entry]) => this.isExpired(entry));
    for (const [key, entry] of expiredEntries) {
      this.remove(key);
    }

    // Check if we're still over the size limit
    if (this.calculateCacheSize() > this.maxSize) {
      // Remove least recently accessed entries
      const sortedEntries = entries
        .filter(([key]) => this.cacheIndex.entries[key]) // Only existing entries
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

      for (const [key] of sortedEntries) {
        this.remove(key);
        if (this.calculateCacheSize() <= this.maxSize * 0.8) { // Leave some buffer
          break;
        }
      }
    }
  }

  has(template: TemplateConfig): boolean {
    const cacheKey = this.generateCacheKey(template);
    const entry = this.cacheIndex.entries[cacheKey];
    
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.remove(cacheKey);
      return false;
    }
    if (!fs.existsSync(entry.path)) {
      this.remove(cacheKey);
      return false;
    }

    return true;
  }

  get(template: TemplateConfig): string | null {
    const cacheKey = this.generateCacheKey(template);
    const entry = this.cacheIndex.entries[cacheKey];

    if (!this.has(template)) {
      return null;
    }

    // Update last accessed time
    entry.lastAccessed = Date.now();
    this.saveIndex();

    this.logger.debug(`Cache hit for template: ${template.name}`);
    return entry.path;
  }

  set(template: TemplateConfig, sourcePath: string): string {
    const cacheKey = this.generateCacheKey(template);
    const cachePath = this.getCachePath(cacheKey);
    const now = Date.now();

    try {
      // Copy the template to cache
      if (fs.existsSync(cachePath)) {
        fs.rmSync(cachePath, { recursive: true, force: true });
      }

      this.copyDirectory(sourcePath, cachePath);

      // Create cache entry
      const entry: CacheEntry = {
        template,
        cachedAt: now,
        lastAccessed: now,
        path: cachePath,
        hash: cacheKey
      };

      this.cacheIndex.entries[cacheKey] = entry;
      this.saveIndex();

      // Cleanup if necessary
      this.cleanup();

      this.logger.debug(`Cached template: ${template.name} at ${cachePath}`);
      return cachePath;
    } catch (error) {
      throw new FileSystemError('cache template', cachePath, error);
    }
  }

  private copyDirectory(src: string, dest: string): void {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      const stats = fs.statSync(srcPath);

      if (stats.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  remove(cacheKeyOrTemplate: string | TemplateConfig): boolean {
    const cacheKey = typeof cacheKeyOrTemplate === 'string' 
      ? cacheKeyOrTemplate 
      : this.generateCacheKey(cacheKeyOrTemplate);

    const entry = this.cacheIndex.entries[cacheKey];
    if (!entry) return false;

    try {
      if (fs.existsSync(entry.path)) {
        fs.rmSync(entry.path, { recursive: true, force: true });
      }
      delete this.cacheIndex.entries[cacheKey];
      this.saveIndex();
      
      this.logger.debug(`Removed cached template: ${entry.template.name}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to remove cached template: ${entry.template.name}`, error as Error);
      return false;
    }
  }

  clear(): void {
    try {
      if (fs.existsSync(this.cacheDir)) {
        fs.rmSync(this.cacheDir, { recursive: true, force: true });
      }
      this.ensureCacheDirectory();
      this.cacheIndex = { entries: {}, version: '1.0.0' };
      this.saveIndex();
      
      this.logger.info('Cache cleared successfully');
    } catch (error) {
      throw new FileSystemError('clear cache', this.cacheDir, error);
    }
  }

  getStats(): { count: number; size: number; oldestEntry?: Date; newestEntry?: Date } {
    const entries = Object.values(this.cacheIndex.entries);
    const size = this.calculateCacheSize();
    
    let oldestEntry: Date | undefined;
    let newestEntry: Date | undefined;

    if (entries.length > 0) {
      const timestamps = entries.map(e => e.cachedAt);
      oldestEntry = new Date(Math.min(...timestamps));
      newestEntry = new Date(Math.max(...timestamps));
    }

    return {
      count: entries.length,
      size,
      oldestEntry,
      newestEntry
    };
  }

  list(): Array<{ template: TemplateConfig; cachedAt: Date; lastAccessed: Date; size: number }> {
    return Object.values(this.cacheIndex.entries).map(entry => ({
      template: entry.template,
      cachedAt: new Date(entry.cachedAt),
      lastAccessed: new Date(entry.lastAccessed),
      size: fs.existsSync(entry.path) ? this.getDirectorySize(entry.path) : 0
    }));
  }
}
