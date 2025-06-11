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
exports.ValidationUtils = void 0;
const path = __importStar(require("path"));
const errors_1 = require("../errors");
class ValidationUtils {
    static validateProjectName(name) {
        if (!name || name.trim().length === 0) {
            throw new errors_1.ValidationError('projectName', name, 'Project name cannot be empty');
        }
        if (name.length > 214) {
            throw new errors_1.ValidationError('projectName', name, 'Project name must be less than 214 characters');
        }
        if (name.startsWith('.') || name.startsWith('_')) {
            throw new errors_1.ValidationError('projectName', name, 'Project name cannot start with . or _');
        }
        const invalidChars = /[~)('!*\s]/;
        if (invalidChars.test(name)) {
            throw new errors_1.ValidationError('projectName', name, 'Project name contains invalid characters');
        }
        const reservedNames = ['node_modules', 'favicon.ico'];
        if (reservedNames.includes(name.toLowerCase())) {
            throw new errors_1.ValidationError('projectName', name, 'Project name is reserved');
        }
    }
    static validateVendorName(vendor) {
        if (!vendor || vendor.trim().length === 0) {
            throw new errors_1.ValidationError('vendor', vendor, 'Vendor name cannot be empty');
        }
        if (vendor.length > 100) {
            throw new errors_1.ValidationError('vendor', vendor, 'Vendor name must be less than 100 characters');
        }
        const validPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
        if (!validPattern.test(vendor)) {
            throw new errors_1.ValidationError('vendor', vendor, 'Vendor name must start with alphanumeric character and contain only letters, numbers, dots, hyphens, and underscores');
        }
    }
    static validateGitUrl(url) {
        if (!url || url.trim().length === 0) {
            throw new errors_1.ValidationError('gitUrl', url, 'Git URL cannot be empty');
        }
        const gitUrlPattern = /^(https?:\/\/|git@).+\.git$/;
        if (!gitUrlPattern.test(url)) {
            throw new errors_1.ValidationError('gitUrl', url, 'Invalid Git URL format');
        }
    }
    static validateDirectoryPath(dirPath) {
        if (!dirPath || dirPath.trim().length === 0) {
            throw new errors_1.ValidationError('directoryPath', dirPath, 'Directory path cannot be empty');
        }
        const resolvedPath = path.resolve(dirPath);
        // Check if path is within safe boundaries (no traversal attacks)
        if (resolvedPath.includes('..')) {
            throw new errors_1.ValidationError('directoryPath', dirPath, 'Directory path contains unsafe traversal');
        }
    }
    static validateVersion(version) {
        if (!version || version.trim().length === 0) {
            throw new errors_1.ValidationError('version', version, 'Version cannot be empty');
        }
        const semverPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?(\+[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?$/;
        if (!semverPattern.test(version)) {
            throw new errors_1.ValidationError('version', version, 'Version must follow semantic versioning (e.g., 1.0.0)');
        }
    }
    static validateDescription(description) {
        if (description && description.length > 500) {
            throw new errors_1.ValidationError('description', description, 'Description must be less than 500 characters');
        }
    }
    static sanitizeInput(input) {
        return input.trim().replace(/[<>:"\/\\|?*]/g, '');
    }
}
exports.ValidationUtils = ValidationUtils;
//# sourceMappingURL=validation.js.map