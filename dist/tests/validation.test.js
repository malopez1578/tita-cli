"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../src/errors");
const validation_1 = require("../src/utils/validation");
describe('ValidationUtils', () => {
    describe('validateProjectName', () => {
        it('should accept valid project names', () => {
            const validNames = ['my-project', 'myProject', 'my_project', 'project123'];
            validNames.forEach(name => {
                expect(() => validation_1.ValidationUtils.validateProjectName(name)).not.toThrow();
            });
        });
        it('should reject empty project names', () => {
            expect(() => validation_1.ValidationUtils.validateProjectName('')).toThrow(errors_1.ValidationError);
            expect(() => validation_1.ValidationUtils.validateProjectName('   ')).toThrow(errors_1.ValidationError);
        });
        it('should reject project names with invalid characters', () => {
            const invalidNames = ['my project', 'my!project', 'my*project', 'my(project)'];
            invalidNames.forEach(name => {
                expect(() => validation_1.ValidationUtils.validateProjectName(name)).toThrow(errors_1.ValidationError);
            });
        });
        it('should reject project names that start with dots or underscores', () => {
            expect(() => validation_1.ValidationUtils.validateProjectName('.myproject')).toThrow(errors_1.ValidationError);
            expect(() => validation_1.ValidationUtils.validateProjectName('_myproject')).toThrow(errors_1.ValidationError);
        });
        it('should reject reserved names', () => {
            expect(() => validation_1.ValidationUtils.validateProjectName('node_modules')).toThrow(errors_1.ValidationError);
            expect(() => validation_1.ValidationUtils.validateProjectName('favicon.ico')).toThrow(errors_1.ValidationError);
        });
        it('should reject names that are too long', () => {
            const longName = 'a'.repeat(215);
            expect(() => validation_1.ValidationUtils.validateProjectName(longName)).toThrow(errors_1.ValidationError);
        });
    });
    describe('validateVendorName', () => {
        it('should accept valid vendor names', () => {
            const validVendors = ['mycompany', 'my-company', 'my.company', 'company123'];
            validVendors.forEach(vendor => {
                expect(() => validation_1.ValidationUtils.validateVendorName(vendor)).not.toThrow();
            });
        });
        it('should reject empty vendor names', () => {
            expect(() => validation_1.ValidationUtils.validateVendorName('')).toThrow(errors_1.ValidationError);
            expect(() => validation_1.ValidationUtils.validateVendorName('   ')).toThrow(errors_1.ValidationError);
        });
        it('should reject vendor names that don\'t start with alphanumeric characters', () => {
            expect(() => validation_1.ValidationUtils.validateVendorName('-mycompany')).toThrow(errors_1.ValidationError);
            expect(() => validation_1.ValidationUtils.validateVendorName('.mycompany')).toThrow(errors_1.ValidationError);
        });
        it('should reject vendor names that are too long', () => {
            const longVendor = 'a'.repeat(101);
            expect(() => validation_1.ValidationUtils.validateVendorName(longVendor)).toThrow(errors_1.ValidationError);
        });
    });
    describe('validateGitUrl', () => {
        it('should accept valid Git URLs', () => {
            const validUrls = [
                'https://gitlab.com/user/repo.git',
                'git@gitlab.com:user/repo.git',
                'http://gitlab.com/user/repo.git'
            ];
            validUrls.forEach(url => {
                expect(() => validation_1.ValidationUtils.validateGitUrl(url)).not.toThrow();
            });
        });
        it('should reject invalid Git URLs', () => {
            const invalidUrls = [
                '',
                'not-a-url',
                'https://gitlab.com/user/repo',
                'ftp://gitlab.com/user/repo.git'
            ];
            invalidUrls.forEach(url => {
                expect(() => validation_1.ValidationUtils.validateGitUrl(url)).toThrow(errors_1.ValidationError);
            });
        });
    });
    describe('validateVersion', () => {
        it('should accept valid semantic versions', () => {
            const validVersions = ['1.0.0', '2.1.3', '1.0.0-alpha', '1.0.0+build'];
            validVersions.forEach(version => {
                expect(() => validation_1.ValidationUtils.validateVersion(version)).not.toThrow();
            });
        });
        it('should reject invalid versions', () => {
            const invalidVersions = ['', '1', '1.0', '1.0.0.0', 'v1.0.0', 'invalid'];
            invalidVersions.forEach(version => {
                expect(() => validation_1.ValidationUtils.validateVersion(version)).toThrow(errors_1.ValidationError);
            });
        });
    });
    describe('sanitizeInput', () => {
        it('should remove dangerous characters', () => {
            const input = 'my<project>with"special|chars';
            const result = validation_1.ValidationUtils.sanitizeInput(input);
            expect(result).toBe('myprojectwithspecialchars');
        });
        it('should trim whitespace', () => {
            const input = '  my project  ';
            const result = validation_1.ValidationUtils.sanitizeInput(input);
            expect(result).toBe('my project');
        });
    });
});
//# sourceMappingURL=validation.test.js.map