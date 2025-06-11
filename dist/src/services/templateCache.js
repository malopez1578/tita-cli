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
exports.TemplateCache = void 0;
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const errors_1 = require("../errors");
class TemplateCache {
    constructor(cacheDir, logger, maxAge = 24 * 60 * 60 * 1000, // 24 hours
    maxSize = 500 * 1024 * 1024 // 500 MB
    ) {
        this.cacheDir = cacheDir;
        this.indexPath = path.join(cacheDir, 'index.json');
        this.logger = logger;
        this.maxAge = maxAge;
        this.maxSize = maxSize;
        this.cacheIndex = this.loadIndex();
        this.ensureCacheDirectory();
    }
    ensureCacheDirectory() {
        try {
            if (!fs.existsSync(this.cacheDir)) {
                fs.mkdirSync(this.cacheDir, { recursive: true });
            }
        }
        catch (error) {
            throw new errors_1.FileSystemError('create cache directory', this.cacheDir, error);
        }
    }
    loadIndex() {
        try {
            if (fs.existsSync(this.indexPath)) {
                const indexData = fs.readFileSync(this.indexPath, 'utf-8');
                return JSON.parse(indexData);
            }
        }
        catch (error) {
            this.logger.warn(`Failed to load cache index, creating new one: ${error}`);
        }
        return {
            entries: {},
            version: '1.0.0'
        };
    }
    saveIndex() {
        try {
            fs.writeFileSync(this.indexPath, JSON.stringify(this.cacheIndex, null, 2));
        }
        catch (error) {
            throw new errors_1.FileSystemError('save cache index', this.indexPath, error);
        }
    }
    generateCacheKey(template) {
        const data = `${template.name}:${template.gitlabUrl}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    getCachePath(cacheKey) {
        return path.join(this.cacheDir, cacheKey);
    }
    isExpired(entry) {
        const now = Date.now();
        return (now - entry.cachedAt) > this.maxAge;
    }
    calculateCacheSize() {
        let totalSize = 0;
        for (const entry of Object.values(this.cacheIndex.entries)) {
            try {
                if (fs.existsSync(entry.path)) {
                    const stats = fs.statSync(entry.path);
                    if (stats.isDirectory()) {
                        totalSize += this.getDirectorySize(entry.path);
                    }
                    else {
                        totalSize += stats.size;
                    }
                }
            }
            catch (error) {
                this.logger.debug(`Failed to calculate size for ${entry.path}: ${error}`);
            }
        }
        return totalSize;
    }
    getDirectorySize(dirPath) {
        let totalSize = 0;
        try {
            const items = fs.readdirSync(dirPath);
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stats = fs.statSync(itemPath);
                if (stats.isDirectory()) {
                    totalSize += this.getDirectorySize(itemPath);
                }
                else {
                    totalSize += stats.size;
                }
            }
        }
        catch (error) {
            this.logger.debug(`Failed to calculate directory size for ${dirPath}: ${error}`);
        }
        return totalSize;
    }
    cleanup() {
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
    has(template) {
        const cacheKey = this.generateCacheKey(template);
        const entry = this.cacheIndex.entries[cacheKey];
        if (!entry)
            return false;
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
    get(template) {
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
    set(template, sourcePath) {
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
            const entry = {
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
        }
        catch (error) {
            throw new errors_1.FileSystemError('cache template', cachePath, error);
        }
    }
    copyDirectory(src, dest) {
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
            }
            else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
    remove(cacheKeyOrTemplate) {
        const cacheKey = typeof cacheKeyOrTemplate === 'string'
            ? cacheKeyOrTemplate
            : this.generateCacheKey(cacheKeyOrTemplate);
        const entry = this.cacheIndex.entries[cacheKey];
        if (!entry)
            return false;
        try {
            if (fs.existsSync(entry.path)) {
                fs.rmSync(entry.path, { recursive: true, force: true });
            }
            delete this.cacheIndex.entries[cacheKey];
            this.saveIndex();
            this.logger.debug(`Removed cached template: ${entry.template.name}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to remove cached template: ${entry.template.name}`, error);
            return false;
        }
    }
    clear() {
        try {
            if (fs.existsSync(this.cacheDir)) {
                fs.rmSync(this.cacheDir, { recursive: true, force: true });
            }
            this.ensureCacheDirectory();
            this.cacheIndex = { entries: {}, version: '1.0.0' };
            this.saveIndex();
            this.logger.info('Cache cleared successfully');
        }
        catch (error) {
            throw new errors_1.FileSystemError('clear cache', this.cacheDir, error);
        }
    }
    getStats() {
        const entries = Object.values(this.cacheIndex.entries);
        const size = this.calculateCacheSize();
        let oldestEntry;
        let newestEntry;
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
    list() {
        return Object.values(this.cacheIndex.entries).map(entry => ({
            template: entry.template,
            cachedAt: new Date(entry.cachedAt),
            lastAccessed: new Date(entry.lastAccessed),
            size: fs.existsSync(entry.path) ? this.getDirectorySize(entry.path) : 0
        }));
    }
}
exports.TemplateCache = TemplateCache;
//# sourceMappingURL=templateCache.js.map