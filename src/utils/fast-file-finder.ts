import * as fs from 'fs';
import * as path from 'path';

export class FastFileFinder {
  private readonly maxDepth: number;
  private readonly ignoredDirs: Set<string>;
  private readonly ignoredFiles: Set<string>;

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

  findPackageJsonFiles(rootDir: string): string[] {
    const results: string[] = [];
    this.searchForPackageJson(rootDir, 0, results);
    
    // Filtrar duplicados y ordenar por profundidad (más específicos primero)
    const uniqueResults = [...new Set(results)];
    return uniqueResults.sort((a, b) => {
      const depthA = a.split(path.sep).length;
      const depthB = b.split(path.sep).length;
      return depthB - depthA; // Más profundo primero
    });
  }

  private searchForPackageJson(currentDir: string, depth: number, results: string[]): void {
    // Límite de profundidad para evitar búsquedas infinitas
    if (depth > this.maxDepth) {
      return;
    }

    try {
      const items = fs.readdirSync(currentDir, { withFileTypes: true });
      
      // Buscar package.json en el directorio actual
      const hasPackageJson = items.some(item => 
        item.name === 'package.json' && item.isFile()
      );
      
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
    } catch  {
     
    }
  }

  findManifestFiles(rootDir: string, fileName = 'manifest.json'): string[] {
    const results: string[] = [];
    
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

  private searchForFile(currentDir: string, fileName: string, depth: number, results: string[]): void {
    if (depth > this.maxDepth) {
      return;
    }

    try {
      const items = fs.readdirSync(currentDir, { withFileTypes: true });
      
      // Buscar el archivo en el directorio actual
      const hasFile = items.some(item => 
        item.name === fileName && item.isFile()
      );
      
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
    } catch  {
     
    }
  }

  findFilesWithExtension(rootDir: string, extension: string, maxResults = 50): string[] {
    const results: string[] = [];
    const normalizedExt = extension.startsWith('.') ? extension : `.${extension}`;
    
    this.searchForExtension(rootDir, normalizedExt, 0, results, maxResults);
    return results;
  }

  private searchForExtension(
    currentDir: string, 
    extension: string, 
    depth: number, 
    results: string[], 
    maxResults: number
  ): void {
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
    } catch{
    }
  }

  findDirectoriesWithName(rootDir: string, dirName: string): string[] {
    const results: string[] = [];
    this.searchForDirectory(rootDir, dirName, 0, results);
    return [...new Set(results)]; // Eliminar duplicados
  }

  private searchForDirectory(currentDir: string, dirName: string, depth: number, results: string[]): void {
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
    } catch  {
    }
  }

  getProjectStructure(rootDir: string, maxDepth = 3): ProjectStructure {
    const structure: ProjectStructure = {
      root: rootDir,
      directories: [],
      files: [],
      packageJsons: [],
      manifests: []
    };

    this.buildStructure(rootDir, 0, maxDepth, structure);
    return structure;
  }

  private buildStructure(
    currentDir: string, 
    depth: number, 
    maxDepth: number, 
    structure: ProjectStructure
  ): void {
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
        } else if (item.isFile() && !this.ignoredFiles.has(item.name)) {
          structure.files.push(relativePath);
          
          // Identificar archivos especiales
          if (item.name === 'package.json') {
            structure.packageJsons.push(relativePath);
          } else if (item.name === 'manifest.json') {
            structure.manifests.push(relativePath);
          }
        }
      }
    } catch  {
    }
  }

  // Utilidades adicionales
  
  isValidProjectDirectory(dirPath: string): boolean {
    try {
      const stats = fs.statSync(dirPath);
      if (!stats.isDirectory()) {
        return false;
      }

      // Verificar que no sea un directorio del sistema
      const baseName = path.basename(dirPath);
      return !this.ignoredDirs.has(baseName) && !baseName.startsWith('.');
    } catch {
      return false;
    }
  }

  getDirectorySize(dirPath: string): number {
    let size = 0;
    
    try {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory() && !this.ignoredDirs.has(item)) {
          size += this.getDirectorySize(fullPath);
        } else if (stats.isFile()) {
          size += stats.size;
        }
      }
    } catch  {
    }
    
    return size;
  }

  countFiles(dirPath: string): FileCount {
    const count: FileCount = {
      totalFiles: 0,
      totalDirectories: 0,
      codeFiles: 0,
      configFiles: 0
    };

    this.countFilesRecursive(dirPath, 0, count);
    return count;
  }

  private countFilesRecursive(currentDir: string, depth: number, count: FileCount): void {
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
        } else if (item.isFile() && !this.ignoredFiles.has(item.name)) {
          count.totalFiles++;
          
          // Clasificar tipos de archivo
          const ext = path.extname(item.name).toLowerCase();
          if (['.ts', '.js', '.tsx', '.jsx', '.vue', '.py', '.java', '.cpp', '.c', '.cs'].includes(ext)) {
            count.codeFiles++;
          } else if (['.json', '.yaml', '.yml', '.toml', '.ini', '.env'].includes(ext)) {
            count.configFiles++;
          }
        }
      }
    } catch {
    }
  }
}

export interface ProjectStructure {
  root: string;
  directories: string[];
  files: string[];
  packageJsons: string[];
  manifests: string[];
}

export interface FileCount {
  totalFiles: number;
  totalDirectories: number;
  codeFiles: number;
  configFiles: number;
}
