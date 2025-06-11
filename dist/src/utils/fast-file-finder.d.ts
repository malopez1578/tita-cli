export declare class FastFileFinder {
    private readonly maxDepth;
    private readonly ignoredDirs;
    private readonly ignoredFiles;
    constructor(maxDepth?: number);
    findPackageJsonFiles(rootDir: string): string[];
    private searchForPackageJson;
    findManifestFiles(rootDir: string, fileName?: string): string[];
    private searchForFile;
    findFilesWithExtension(rootDir: string, extension: string, maxResults?: number): string[];
    private searchForExtension;
    findDirectoriesWithName(rootDir: string, dirName: string): string[];
    private searchForDirectory;
    getProjectStructure(rootDir: string, maxDepth?: number): ProjectStructure;
    private buildStructure;
    isValidProjectDirectory(dirPath: string): boolean;
    getDirectorySize(dirPath: string): number;
    countFiles(dirPath: string): FileCount;
    private countFilesRecursive;
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
//# sourceMappingURL=fast-file-finder.d.ts.map