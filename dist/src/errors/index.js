"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrerequisiteError = exports.ManifestError = exports.ValidationError = exports.FileSystemError = exports.CommandExecutionError = exports.TitaError = void 0;
class TitaError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'TitaError';
        Error.captureStackTrace(this, TitaError);
    }
}
exports.TitaError = TitaError;
class CommandExecutionError extends TitaError {
    constructor(command, exitCode, details) {
        super(`Command execution failed: ${command}`, 'COMMAND_EXECUTION_ERROR', { command, exitCode, ...details });
    }
}
exports.CommandExecutionError = CommandExecutionError;
class FileSystemError extends TitaError {
    constructor(operation, path, details) {
        super(`File system operation failed: ${operation} on ${path}`, 'FILESYSTEM_ERROR', { operation, path, ...details });
    }
}
exports.FileSystemError = FileSystemError;
class ValidationError extends TitaError {
    constructor(field, value, reason) {
        super(`Validation failed for ${field}: ${reason}`, 'VALIDATION_ERROR', { field, value, reason });
    }
}
exports.ValidationError = ValidationError;
class ManifestError extends TitaError {
    constructor(operation, path, details) {
        super(`Manifest operation failed: ${operation}`, 'MANIFEST_ERROR', { operation, path, ...details });
    }
}
exports.ManifestError = ManifestError;
class PrerequisiteError extends TitaError {
    constructor(tool, details) {
        super(`Required tool not found: ${tool}`, 'PREREQUISITE_ERROR', { tool, ...details });
    }
}
exports.PrerequisiteError = PrerequisiteError;
//# sourceMappingURL=index.js.map