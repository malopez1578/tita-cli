export declare class TitaError extends Error {
    code: string;
    details?: any | undefined;
    constructor(message: string, code: string, details?: any | undefined);
}
export declare class CommandExecutionError extends TitaError {
    constructor(command: string, exitCode?: number, details?: any);
}
export declare class FileSystemError extends TitaError {
    constructor(operation: string, path: string, details?: any);
}
export declare class ValidationError extends TitaError {
    constructor(field: string, value: any, reason: string);
}
export declare class ManifestError extends TitaError {
    constructor(operation: string, path?: string, details?: any);
}
export declare class PrerequisiteError extends TitaError {
    constructor(tool: string, details?: any);
}
//# sourceMappingURL=index.d.ts.map