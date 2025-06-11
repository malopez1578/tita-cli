
export class TitaError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'TitaError';
    Error.captureStackTrace(this, TitaError);
  }
}

export class CommandExecutionError extends TitaError {
  constructor(command: string, exitCode?: number, details?: any) {
    super(
      `Command execution failed: ${command}`,
      'COMMAND_EXECUTION_ERROR',
      { command, exitCode, ...details }
    );
  }
}

export class FileSystemError extends TitaError {
  constructor(operation: string, path: string, details?: any) {
    super(
      `File system operation failed: ${operation} on ${path}`,
      'FILESYSTEM_ERROR',
      { operation, path, ...details }
    );
  }
}

export class ValidationError extends TitaError {
  constructor(field: string, value: any, reason: string) {
    super(
      `Validation failed for ${field}: ${reason}`,
      'VALIDATION_ERROR',
      { field, value, reason }
    );
  }
}

export class ManifestError extends TitaError {
  constructor(operation: string, path?: string, details?: any) {
    super(
      `Manifest operation failed: ${operation}`,
      'MANIFEST_ERROR',
      { operation, path, ...details }
    );
  }
}

export class PrerequisiteError extends TitaError {
  constructor(tool: string, details?: any) {
    super(
      `Required tool not found: ${tool}`,
      'PREREQUISITE_ERROR',
      { tool, ...details }
    );
  }
}
