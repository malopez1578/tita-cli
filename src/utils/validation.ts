
import * as path from 'path';
import { ValidationError } from '../errors';

export class ValidationUtils {
  static validateProjectName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('projectName', name, 'Project name cannot be empty');
    }

    if (name.length > 214) {
      throw new ValidationError('projectName', name, 'Project name must be less than 214 characters');
    }

    if (name.startsWith('.') || name.startsWith('_')) {
      throw new ValidationError('projectName', name, 'Project name cannot start with . or _');
    }

    const invalidChars = /[~)('!*\s]/;
    if (invalidChars.test(name)) {
      throw new ValidationError('projectName', name, 'Project name contains invalid characters');
    }

    const reservedNames = ['node_modules', 'favicon.ico'];
    if (reservedNames.includes(name.toLowerCase())) {
      throw new ValidationError('projectName', name, 'Project name is reserved');
    }
  }

  static validateVendorName(vendor: string): void {
    if (!vendor || vendor.trim().length === 0) {
      throw new ValidationError('vendor', vendor, 'Vendor name cannot be empty');
    }

    if (vendor.length > 100) {
      throw new ValidationError('vendor', vendor, 'Vendor name must be less than 100 characters');
    }

    const validPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
    if (!validPattern.test(vendor)) {
      throw new ValidationError('vendor', vendor, 'Vendor name must start with alphanumeric character and contain only letters, numbers, dots, hyphens, and underscores');
    }
  }

  static validateGitUrl(url: string): void {
    if (!url || url.trim().length === 0) {
      throw new ValidationError('gitUrl', url, 'Git URL cannot be empty');
    }

    const gitUrlPattern = /^(https?:\/\/|git@).+\.git$/;
    if (!gitUrlPattern.test(url)) {
      throw new ValidationError('gitUrl', url, 'Invalid Git URL format');
    }
  }

  static validateDirectoryPath(dirPath: string): void {
    if (!dirPath || dirPath.trim().length === 0) {
      throw new ValidationError('directoryPath', dirPath, 'Directory path cannot be empty');
    }

    const resolvedPath = path.resolve(dirPath);
    
    // Check if path is within safe boundaries (no traversal attacks)
    if (resolvedPath.includes('..')) {
      throw new ValidationError('directoryPath', dirPath, 'Directory path contains unsafe traversal');
    }
  }

  static validateVersion(version: string): void {
    if (!version || version.trim().length === 0) {
      throw new ValidationError('version', version, 'Version cannot be empty');
    }

    const semverPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?(\+[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?$/;
    if (!semverPattern.test(version)) {
      throw new ValidationError('version', version, 'Version must follow semantic versioning (e.g., 1.0.0)');
    }
  }

  static validateDescription(description: string): void {
    if (description && description.length > 500) {
      throw new ValidationError('description', description, 'Description must be less than 500 characters');
    }
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>:"\/\\|?*]/g, '');
  }
}
