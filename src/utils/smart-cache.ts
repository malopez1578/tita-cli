import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
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

export class SmartCache {
  private readonly cacheDir: string;
  private readonly metadataFile: string;
  private readonly logger: Logger;
  private readonly cloner: OptimizedCloner;
  private readonly ttlHours: number;
  private readonly maxCacheSizeMB: number;

  constructor(logger: Logger, cloner: OptimizedCloner, ttlHours = 24, maxCacheSizeMB = 500) {
    this.cacheDir = path.join(os.homedir(), '.tita-cli', 'smart-cache');
    this.metadataFile = path.join(this.cacheDir, 'metadata.json');
    this.logger = logger;
    this.cloner = cloner;
    this.ttlHours = ttlHours;
    this.maxCacheSizeMB = maxCacheSizeMB;
    
    this.ensureCacheDirectory();
  }

  private ensureCacheDirectory(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  async getTemplate(templateName: string, gitUrl: string): Promise<string> {
    const templatePath = path.join(this.cacheDir, this.sanitizeTemplateName(templateName));
    const metadata = this.loadMetadata();
    const templateMeta = metadata[templateName];

    // Verificar si el cache es válido
    if (await this.isCacheValid(templatePath, templateMeta, gitUrl)) {
      this.updateHitCount(templateName);
      this.logger.success('Using cached template (fresh)');
      return templatePath;
    }

    // Cache inválido o no existe, actualizar
    await this.updateCache(templateName, gitUrl, templatePath);
    this.saveMetadata(templateName, gitUrl);
    
    return templatePath;
  }

  private async isCacheValid(templatePath: string, metadata: CacheMetadata | undefined, gitUrl: string): Promise<boolean> {
    if (!fs.existsSync(templatePath) || !metadata) {
      return false;
    }

    // Verificar URL coincide
    if (metadata.gitUrl !== gitUrl) {
      this.logger.debug('Cache invalid: URL mismatch');
      return false;
    }

    // Verificar TTL
    const now = Date.now();
    const ageHours = (now - metadata.lastUpdated) / (1000 * 60 * 60);
    
    if (ageHours >= this.ttlHours) {
      this.logger.debug(`Cache expired: ${ageHours.toFixed(1)} hours old (TTL: ${this.ttlHours}h)`);
      return false;
    }

    // Verificar integridad del directorio
    try {
      const stats = fs.statSync(templatePath);
      if (!stats.isDirectory()) {
        this.logger.debug('Cache invalid: not a directory');
        return false;
      }
      
      // Verificar que no esté vacío
      const files = fs.readdirSync(templatePath);
      if (files.length === 0) {
        this.logger.debug('Cache invalid: empty directory');
        return false;
      }
    } catch  {
      this.logger.debug('Cache invalid: access error');
      return false;
    }

    return true;
  }

  private async updateCache(templateName: string, gitUrl: string, templatePath: string): Promise<void> {
    // Limpiar cache anterior si existe
    if (fs.existsSync(templatePath)) {
      fs.rmSync(templatePath, { recursive: true, force: true });
    }

    this.logger.info(`Updating cache for template: ${templateName}`);
    
    try {
      await this.cloner.cloneTemplateWithFallback(gitUrl, templatePath);
      
      // Limpiar directorio .git para ahorrar espacio
      const gitDir = path.join(templatePath, '.git');
      if (fs.existsSync(gitDir)) {
        fs.rmSync(gitDir, { recursive: true, force: true });
        this.logger.debug('Removed .git directory to save space');
      }
      
      this.logger.success('Template cache updated');
      
      // Verificar límites de tamaño del cache
      await this.enforcesCacheLimits();
      
    } catch (error) {
      // Limpiar el directorio parcial si falla
      if (fs.existsSync(templatePath)) {
        fs.rmSync(templatePath, { recursive: true, force: true });
      }
      throw error;
    }
  }

  private async enforcesCacheLimits(): Promise<void> {
    const totalSizeMB = this.getTotalCacheSizeMB();
    
    if (totalSizeMB > this.maxCacheSizeMB) {
      this.logger.warn(`Cache size (${totalSizeMB.toFixed(1)}MB) exceeds limit (${this.maxCacheSizeMB}MB)`);
      await this.cleanLeastUsedCache();
    }
  }

  private async cleanLeastUsedCache(): Promise<void> {
    const metadata = this.loadMetadata();
    
    // Ordenar por uso (hits) y última vez accedido
    const sortedTemplates = Object.entries(metadata)
      .sort(([, a], [, b]) => {
        // Priorizar por hits, luego por tiempo de acceso
        if (a.hits !== b.hits) {
          return a.hits - b.hits;
        }
        return a.lastAccessed - b.lastAccessed;
      });

    let cleanedCount = 0;
    const targetSizeMB = this.maxCacheSizeMB * 0.8; // Limpiar hasta 80% del límite

    for (const [templateName] of sortedTemplates) {
      const templatePath = path.join(this.cacheDir, this.sanitizeTemplateName(templateName));
      
      if (fs.existsSync(templatePath)) {
        fs.rmSync(templatePath, { recursive: true, force: true });
        delete metadata[templateName];
        cleanedCount++;
        
        this.logger.debug(`Removed cached template: ${templateName}`);
        
        if (this.getTotalCacheSizeMB() <= targetSizeMB) {
          break;
        }
      }
    }

    if (cleanedCount > 0) {
      this.saveMetadataObject(metadata);
      this.logger.info(`Cleaned ${cleanedCount} cached template(s) to free space`);
    }
  }

  private loadMetadata(): Record<string, CacheMetadata> {
    try {
      if (fs.existsSync(this.metadataFile)) {
        const data = fs.readFileSync(this.metadataFile, 'utf8');
        return JSON.parse(data);
      }
    } catch {
      this.logger.warn('Failed to load cache metadata, starting fresh');
    }
    return {};
  }

  private saveMetadata(templateName: string, gitUrl: string): void {
    const metadata = this.loadMetadata();
    const templatePath = path.join(this.cacheDir, this.sanitizeTemplateName(templateName));
    
    metadata[templateName] = {
      lastUpdated: Date.now(),
      gitUrl,
      size: this.getDirectorySize(templatePath),
      hits: 1,
      lastAccessed: Date.now()
    };

    this.saveMetadataObject(metadata);
  }

  private saveMetadataObject(metadata: Record<string, CacheMetadata>): void {
    try {
      fs.writeFileSync(this.metadataFile, JSON.stringify(metadata, null, 2));
    } catch (error) {
      this.logger.error('Failed to save cache metadata', error as Error);
    }
  }

  private updateHitCount(templateName: string): void {
    const metadata = this.loadMetadata();
    if (metadata[templateName]) {
      metadata[templateName].hits++;
      metadata[templateName].lastAccessed = Date.now();
      this.saveMetadataObject(metadata);
    }
  }

  private getDirectorySize(dirPath: string): number {
    let size = 0;
    try {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          size += this.getDirectorySize(fullPath);
        } else {
          size += stats.size;
        }
      }
    } catch {
      // Ignorar errores de lectura
    }
    return size;
  }

  private getTotalCacheSizeMB(): number {
    let totalSize = 0;
    try {
      const items = fs.readdirSync(this.cacheDir);
      for (const item of items) {
        if (item === 'metadata.json') continue;
        
        const fullPath = path.join(this.cacheDir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          totalSize += this.getDirectorySize(fullPath);
        }
      }
    } catch {
      // Ignorar errores
    }
    return totalSize / (1024 * 1024);
  }

  private sanitizeTemplateName(templateName: string): string {
    return templateName.replace(/[^a-zA-Z0-9-_]/g, '_');
  }

  async cleanOldCache(maxAgeHours = 168): Promise<number> { // Default 7 días
    const metadata = this.loadMetadata();
    const now = Date.now();
    let cleaned = 0;

    for (const [templateName, meta] of Object.entries(metadata)) {
      const ageHours = (now - meta.lastUpdated) / (1000 * 60 * 60);
      
      if (ageHours > maxAgeHours) {
        const templatePath = path.join(this.cacheDir, this.sanitizeTemplateName(templateName));
        if (fs.existsSync(templatePath)) {
          fs.rmSync(templatePath, { recursive: true, force: true });
          delete metadata[templateName];
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      this.saveMetadataObject(metadata);
      this.logger.info(`Cleaned ${cleaned} old cache entries`);
    }

    return cleaned;
  }

  async clearAll(): Promise<void> {
    try {
      if (fs.existsSync(this.cacheDir)) {
        fs.rmSync(this.cacheDir, { recursive: true, force: true });
      }
      this.ensureCacheDirectory();
      this.logger.info('All cache cleared');
    } catch (error) {
      this.logger.error('Failed to clear cache', error as Error);
      throw error;
    }
  }

  getCacheStats(): CacheStats {
    const metadata = this.loadMetadata();
    const now = Date.now();
    
    if (Object.keys(metadata).length === 0) {
      return {
        totalTemplates: 0,
        totalSize: '0 MB',
        oldestCache: 'N/A',
        mostUsed: 'N/A',
        hitRate: 0
      };
    }

    let totalHits = 0;
    let oldestTime = now;
    let mostUsedTemplate = '';
    let maxHits = 0;

    for (const [templateName, meta] of Object.entries(metadata)) {
      totalHits += meta.hits;
      
      if (meta.lastUpdated < oldestTime) {
        oldestTime = meta.lastUpdated;
      }
      
      if (meta.hits > maxHits) {
        maxHits = meta.hits;
        mostUsedTemplate = templateName;
      }
    }

    const totalSizeMB = this.getTotalCacheSizeMB();
    const oldestHours = Math.floor((now - oldestTime) / (1000 * 60 * 60));
    const avgHitRate = totalHits / Object.keys(metadata).length;

    return {
      totalTemplates: Object.keys(metadata).length,
      totalSize: `${totalSizeMB.toFixed(2)} MB`,
      oldestCache: oldestHours > 0 ? `${oldestHours} hours ago` : 'Just now',
      mostUsed: mostUsedTemplate || 'N/A',
      hitRate: Math.round(avgHitRate * 100) / 100
    };
  }

  hasTemplate(templateName: string): boolean {
    const templatePath = path.join(this.cacheDir, this.sanitizeTemplateName(templateName));
    return fs.existsSync(templatePath);
  }

  async isTemplateValid(templateName: string, gitUrl: string): Promise<boolean> {
    const templatePath = path.join(this.cacheDir, this.sanitizeTemplateName(templateName));
    const metadata = this.loadMetadata();
    const templateMeta = metadata[templateName];

    return await this.isCacheValid(templatePath, templateMeta, gitUrl);
  }

  getMetadata(): Record<string, CacheMetadata> {
    return this.loadMetadata();
  }
}
