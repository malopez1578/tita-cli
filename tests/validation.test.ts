import { ValidationError } from '../src/errors';
import { ValidationUtils } from '../src/utils/validation';

describe('ValidationUtils', () => {
  describe('validateProjectName', () => {
    it('should accept valid project names', () => {
      const validNames = ['my-project', 'myProject', 'my_project', 'project123'];
      
      validNames.forEach(name => {
        expect(() => ValidationUtils.validateProjectName(name)).not.toThrow();
      });
    });

    it('should reject empty project names', () => {
      expect(() => ValidationUtils.validateProjectName('')).toThrow(ValidationError);
      expect(() => ValidationUtils.validateProjectName('   ')).toThrow(ValidationError);
    });

    it('should reject project names with invalid characters', () => {
      const invalidNames = ['my project', 'my!project', 'my*project', 'my(project)'];
      
      invalidNames.forEach(name => {
        expect(() => ValidationUtils.validateProjectName(name)).toThrow(ValidationError);
      });
    });

    it('should reject project names that start with dots or underscores', () => {
      expect(() => ValidationUtils.validateProjectName('.myproject')).toThrow(ValidationError);
      expect(() => ValidationUtils.validateProjectName('_myproject')).toThrow(ValidationError);
    });

    it('should reject reserved names', () => {
      expect(() => ValidationUtils.validateProjectName('node_modules')).toThrow(ValidationError);
      expect(() => ValidationUtils.validateProjectName('favicon.ico')).toThrow(ValidationError);
    });

    it('should reject names that are too long', () => {
      const longName = 'a'.repeat(215);
      expect(() => ValidationUtils.validateProjectName(longName)).toThrow(ValidationError);
    });
  });

  describe('validateVendorName', () => {
    it('should accept valid vendor names', () => {
      const validVendors = ['mycompany', 'my-company', 'my.company', 'company123'];
      
      validVendors.forEach(vendor => {
        expect(() => ValidationUtils.validateVendorName(vendor)).not.toThrow();
      });
    });

    it('should reject empty vendor names', () => {
      expect(() => ValidationUtils.validateVendorName('')).toThrow(ValidationError);
      expect(() => ValidationUtils.validateVendorName('   ')).toThrow(ValidationError);
    });

    it('should reject vendor names that don\'t start with alphanumeric characters', () => {
      expect(() => ValidationUtils.validateVendorName('-mycompany')).toThrow(ValidationError);
      expect(() => ValidationUtils.validateVendorName('.mycompany')).toThrow(ValidationError);
    });

    it('should reject vendor names that are too long', () => {
      const longVendor = 'a'.repeat(101);
      expect(() => ValidationUtils.validateVendorName(longVendor)).toThrow(ValidationError);
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
        expect(() => ValidationUtils.validateGitUrl(url)).not.toThrow();
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
        expect(() => ValidationUtils.validateGitUrl(url)).toThrow(ValidationError);
      });
    });
  });

  describe('validateVersion', () => {
    it('should accept valid semantic versions', () => {
      const validVersions = ['1.0.0', '2.1.3', '1.0.0-alpha', '1.0.0+build'];
      
      validVersions.forEach(version => {
        expect(() => ValidationUtils.validateVersion(version)).not.toThrow();
      });
    });

    it('should reject invalid versions', () => {
      const invalidVersions = ['', '1', '1.0', '1.0.0.0', 'v1.0.0', 'invalid'];
      
      invalidVersions.forEach(version => {
        expect(() => ValidationUtils.validateVersion(version)).toThrow(ValidationError);
      });
    });
  });

  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      const input = 'my<project>with"special|chars';
      const result = ValidationUtils.sanitizeInput(input);
      expect(result).toBe('myprojectwithspecialchars');
    });

    it('should trim whitespace', () => {
      const input = '  my project  ';
      const result = ValidationUtils.sanitizeInput(input);
      expect(result).toBe('my project');
    });
  });
});
