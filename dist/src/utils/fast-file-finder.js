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
exports.FastFileFinder = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class FastFileFinder {
    constructor(maxDepth = 5) {
        this.maxDepth = maxDepth;
        this.ignoredDirs = new Set([
            'node_modules',
            '.git',
            'dist',
            'build',
            '.next',
            'coverage',
            '.cache',
            'tmp',
            'temp',
            '.nuxt',
            '.output',
            'public',
            'static',
            'assets',
            '.vscode',
            '.idea',
            'logs'
        ]);
        this.ignoredFiles = new Set([
            '.DS_Store',
            'Thumbs.db',
            '.gitignore',
            '.npmignore',
            'yarn.lock',
            'package-lock.json'
        ]);
    }
    findPackageJsonFiles(rootDir) {
        const results = [];
        this.searchForPackageJson(rootDir, 0, results);
        // Filtrar duplicados y ordenar por profundidad (más específicos primero)
        const uniqueResults = [...new Set(results)];
        return uniqueResults.sort((a, b) => {
            const depthA = a.split(path.sep).length;
            const depthB = b.split(path.sep).length;
            return depthB - depthA; // Más profundo primero
        });
    }
    searchForPackageJson(currentDir, depth, results) {
        // Límite de profundidad para evitar búsquedas infinitas
        if (depth > this.maxDepth) {
            return;
        }
        try {
            const items = fs.readdirSync(currentDir, { withFileTypes: true });
            // Buscar package.json en el directorio actual
            const hasPackageJson = items.some(item => item.name === 'package.json' && item.isFile());
            if (hasPackageJson) {
                results.push(currentDir);
            }
            // Buscar en subdirectorios
            for (const item of items) {
                if (item.isDirectory() &&
                    !this.ignoredDirs.has(item.name) &&
                    !item.name.startsWith('.')) {
                    const fullPath = path.join(currentDir, item.name);
                    this.searchForPackageJson(fullPath, depth + 1, results);
                }
            }
        }
        catch {
        }
    }
    findManifestFiles(rootDir, fileName = 'manifest.json') {
        const results = [];
        // Búsqueda prioritaria en ubicaciones comunes
        const commonPaths = [
            path.join(rootDir, fileName),
            path.join(rootDir, 'src', fileName),
            path.join(rootDir, 'public', fileName),
            path.join(rootDir, 'assets', fileName),
            path.join(rootDir, 'static', fileName),
            path.join(rootDir, 'resources', fileName),
            path.join(rootDir, 'config', fileName)
        ];
        // Verificar ubicaciones comunes primero (más rápido)
        for (const manifestPath of commonPaths) {
            if (fs.existsSync(manifestPath)) {
                results.push(path.dirname(manifestPath));
            }
        }
        // Solo hacer búsqueda completa si no encontramos en ubicaciones comunes
        if (results.length === 0) {
            this.searchForFile(rootDir, fileName, 0, results);
        }
        return [...new Set(results)]; // Eliminar duplicados
    }
    searchForFile(currentDir, fileName, depth, results) {
        if (depth > this.maxDepth) {
            return;
        }
        try {
            const items = fs.readdirSync(currentDir, { withFileTypes: true });
            // Buscar el archivo en el directorio actual
            const hasFile = items.some(item => item.name === fileName && item.isFile());
            if (hasFile) {
                results.push(currentDir);
            }
            // Buscar en subdirectorios
            for (const item of items) {
                if (item.isDirectory() &&
                    !this.ignoredDirs.has(item.name) &&
                    !item.name.startsWith('.')) {
                    const fullPath = path.join(currentDir, item.name);
                    this.searchForFile(fullPath, fileName, depth + 1, results);
                }
            }
        }
        catch {
        }
    }
    findFilesWithExtension(rootDir, extension, maxResults = 50) {
        const results = [];
        const normalizedExt = extension.startsWith('.') ? extension : `.${extension}`;
        this.searchForExtension(rootDir, normalizedExt, 0, results, maxResults);
        return results;
    }
    searchForExtension(currentDir, extension, depth, results, maxResults) {
        if (depth > this.maxDepth || results.length >= maxResults) {
            return;
        }
        try {
            const items = fs.readdirSync(currentDir, { withFileTypes: true });
            // Buscar archivos con la extensión
            for (const item of items) {
                if (results.length >= maxResults) {
                    break;
                }
                if (item.isFile() &&
                    item.name.endsWith(extension) &&
                    !this.ignoredFiles.has(item.name)) {
                    results.push(path.join(currentDir, item.name));
                }
            }
            // Buscar en subdirectorios
            for (const item of items) {
                if (results.length >= maxResults) {
                    break;
                }
                if (item.isDirectory() &&
                    !this.ignoredDirs.has(item.name) &&
                    !item.name.startsWith('.')) {
                    const fullPath = path.join(currentDir, item.name);
                    this.searchForExtension(fullPath, extension, depth + 1, results, maxResults);
                }
            }
        }
        catch {
        }
    }
    findDirectoriesWithName(rootDir, dirName) {
        const results = [];
        this.searchForDirectory(rootDir, dirName, 0, results);
        return [...new Set(results)]; // Eliminar duplicados
    }
    searchForDirectory(currentDir, dirName, depth, results) {
        if (depth > this.maxDepth) {
            return;
        }
        try {
            const items = fs.readdirSync(currentDir, { withFileTypes: true });
            for (const item of items) {
                if (item.isDirectory()) {
                    if (item.name === dirName) {
                        results.push(path.join(currentDir, item.name));
                    }
                    // Continuar búsqueda si no es un directorio ignorado
                    if (!this.ignoredDirs.has(item.name) && !item.name.startsWith('.')) {
                        const fullPath = path.join(currentDir, item.name);
                        this.searchForDirectory(fullPath, dirName, depth + 1, results);
                    }
                }
            }
        }
        catch {
        }
    }
    getProjectStructure(rootDir, maxDepth = 3) {
        const structure = {
            root: rootDir,
            directories: [],
            files: [],
            packageJsons: [],
            manifests: []
        };
        this.buildStructure(rootDir, 0, maxDepth, structure);
        return structure;
    }
    buildStructure(currentDir, depth, maxDepth, structure) {
        if (depth > maxDepth) {
            return;
        }
        try {
            const items = fs.readdirSync(currentDir, { withFileTypes: true });
            for (const item of items) {
                const fullPath = path.join(currentDir, item.name);
                const relativePath = path.relative(structure.root, fullPath);
                if (item.isDirectory() && !this.ignoredDirs.has(item.name)) {
                    structure.directories.push(relativePath);
                    this.buildStructure(fullPath, depth + 1, maxDepth, structure);
                }
                else if (item.isFile() && !this.ignoredFiles.has(item.name)) {
                    structure.files.push(relativePath);
                    // Identificar archivos especiales
                    if (item.name === 'package.json') {
                        structure.packageJsons.push(relativePath);
                    }
                    else if (item.name === 'manifest.json') {
                        structure.manifests.push(relativePath);
                    }
                }
            }
        }
        catch {
        }
    }
    // Utilidades adicionales
    isValidProjectDirectory(dirPath) {
        try {
            const stats = fs.statSync(dirPath);
            if (!stats.isDirectory()) {
                return false;
            }
            // Verificar que no sea un directorio del sistema
            const baseName = path.basename(dirPath);
            return !this.ignoredDirs.has(baseName) && !baseName.startsWith('.');
        }
        catch {
            return false;
        }
    }
    getDirectorySize(dirPath) {
        let size = 0;
        try {
            const items = fs.readdirSync(dirPath);
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const stats = fs.statSync(fullPath);
                if (stats.isDirectory() && !this.ignoredDirs.has(item)) {
                    size += this.getDirectorySize(fullPath);
                }
                else if (stats.isFile()) {
                    size += stats.size;
                }
            }
        }
        catch {
        }
        return size;
    }
    countFiles(dirPath) {
        const count = {
            totalFiles: 0,
            totalDirectories: 0,
            codeFiles: 0,
            configFiles: 0
        };
        this.countFilesRecursive(dirPath, 0, count);
        return count;
    }
    countFilesRecursive(currentDir, depth, count) {
        if (depth > this.maxDepth) {
            return;
        }
        try {
            const items = fs.readdirSync(currentDir, { withFileTypes: true });
            for (const item of items) {
                if (item.isDirectory() && !this.ignoredDirs.has(item.name)) {
                    count.totalDirectories++;
                    const fullPath = path.join(currentDir, item.name);
                    this.countFilesRecursive(fullPath, depth + 1, count);
                }
                else if (item.isFile() && !this.ignoredFiles.has(item.name)) {
                    count.totalFiles++;
                    // Clasificar tipos de archivo
                    const ext = path.extname(item.name).toLowerCase();
                    if (['.ts', '.js', '.tsx', '.jsx', '.vue', '.py', '.java', '.cpp', '.c', '.cs'].includes(ext)) {
                        count.codeFiles++;
                    }
                    else if (['.json', '.yaml', '.yml', '.toml', '.ini', '.env'].includes(ext)) {
                        count.configFiles++;
                    }
                }
            }
        }
        catch {
        }
    }
}
exports.FastFileFinder = FastFileFinder;
//# sourceMappingURL=fast-file-finder.js.map