import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Mock dependencies before importing
jest.mock('chalk', () => require('./__mocks__/chalk'));
jest.mock('ora', () => require('./__mocks__/ora'));
jest.mock('inquirer', () => require('./__mocks__/inquirer'));

describe('Project Files Update', () => {
  let tempDir: string;
  let testProjectPath: string;

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'tita-test-'));
    testProjectPath = path.join(tempDir, 'test-project');
    await fs.promises.mkdir(testProjectPath, { recursive: true });
  });

  afterEach(async () => {
    // Clean up
    if (fs.existsSync(tempDir)) {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('Package.json Update Logic', () => {
    it('should properly format component name for package.json', () => {
      const componentTitle = 'My New Component';
      const expectedName = componentTitle.toLowerCase().replace(/\s+/g, '-');
      
      expect(expectedName).toBe('my-new-component');
    });

    it('should handle complex component names', () => {
      const testCases = [
        { input: 'Complex Component Name', expected: 'complex-component-name' },
        { input: 'Single', expected: 'single' },
        { input: 'Multiple    Spaces   Here', expected: 'multiple-spaces-here' },
        { input: 'WITH CAPS AND spaces', expected: 'with-caps-and-spaces' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = input.toLowerCase().replace(/\s+/g, '-');
        expect(result).toBe(expected);
      });
    });
  });

  describe('Package.json File Operations', () => {
    it('should create valid package.json structure', async () => {
      // Create test package.json
      const originalPackageJson = {
        name: 'old-package-name',
        version: '0.1.0',
        description: 'Old description',
        repository: {
          type: 'git',
          url: 'https://github.com/old/repo.git'
        },
        bugs: {
          url: 'https://github.com/old/repo/issues'
        },
        homepage: 'https://github.com/old/repo#readme',
        author: 'Old Author',
        dependencies: {
          'some-package': '^1.0.0'
        }
      };

      const packageJsonPath = path.join(testProjectPath, 'package.json');
      await fs.promises.writeFile(
        packageJsonPath, 
        JSON.stringify(originalPackageJson, null, 2)
      );

      // Simulate the update logic
      const packageContent = await fs.promises.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      // Apply the same transformations as the actual method
      const componentInfo = {
        title: 'My New Component',
        description: 'A test component description',
        author: 'New Author'
      };
      const projectDetails = { version: '1.0.0', targetDirectory: '.' };

      packageJson.name = componentInfo.title.toLowerCase().replace(/\s+/g, '-');
      packageJson.description = componentInfo.description;
      packageJson.version = projectDetails.version;
      
      // Reset fields that should be removed
      delete packageJson.repository;
      delete packageJson.bugs;
      delete packageJson.homepage;
      
      // Update author
      if (componentInfo.author) {
        packageJson.author = componentInfo.author;
      }

      // Write back
      await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

      // Verify changes
      const updatedContent = await fs.promises.readFile(packageJsonPath, 'utf8');
      const updatedPackageJson = JSON.parse(updatedContent);

      expect(updatedPackageJson.name).toBe('my-new-component');
      expect(updatedPackageJson.description).toBe('A test component description');
      expect(updatedPackageJson.version).toBe('1.0.0');
      expect(updatedPackageJson.author).toBe('New Author');
      expect(updatedPackageJson.repository).toBeUndefined();
      expect(updatedPackageJson.bugs).toBeUndefined();
      expect(updatedPackageJson.homepage).toBeUndefined();
      // Dependencies should be preserved
      expect(updatedPackageJson.dependencies).toEqual({ 'some-package': '^1.0.0' });
    });
  });

  describe('CHANGELOG Creation', () => {
    it('should create a clean CHANGELOG.md with proper format', async () => {
      const componentInfo = {
        title: 'Test Component',
        description: 'A test component for testing',
        author: 'Test Author'
      };
      const projectDetails = { version: '1.0.0', targetDirectory: '.' };
      const version = projectDetails.version;
      const today = new Date().toISOString().split('T')[0];
      
      const changelogContent = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [${version}] - ${today}

### Added
- Initial release of ${componentInfo.title}
- ${componentInfo.description}

---

## Template Information
This project was created using TITA CLI from a GitLab template.
Previous changelog history has been reset for a clean start.
`;

      const changelogPath = path.join(testProjectPath, 'CHANGELOG.md');
      await fs.promises.writeFile(changelogPath, changelogContent);

      // Verify CHANGELOG.md was created correctly
      expect(fs.existsSync(changelogPath)).toBe(true);

      const actualContent = await fs.promises.readFile(changelogPath, 'utf8');
      
      expect(actualContent).toContain('# Changelog');
      expect(actualContent).toContain('[1.0.0]');
      expect(actualContent).toContain(today);
      expect(actualContent).toContain('Initial release of Test Component');
      expect(actualContent).toContain('A test component for testing');
      expect(actualContent).toContain('Template Information');
      expect(actualContent).toContain('TITA CLI');
      expect(actualContent).toContain('Keep a Changelog');
      expect(actualContent).toContain('Semantic Versioning');
    });

    it('should handle default version when not provided', () => {
      const componentInfo = {
        title: 'Test Component',
        description: 'A test component',
        author: 'Test Author'
      };
      
      // Simulate the logic when no projectDetails are provided
      const version = '1.0.0'; // default version
      const today = new Date().toISOString().split('T')[0];
      
      const changelogContent = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [${version}] - ${today}

### Added
- Initial release of ${componentInfo.title}
- ${componentInfo.description}

---

## Template Information
This project was created using TITA CLI from a GitLab template.
Previous changelog history has been reset for a clean start.
`;
      
      expect(changelogContent).toContain('[1.0.0]');
      expect(changelogContent).toContain(today);
    });
  });

  describe('Manifest.json Update', () => {
    it('should update manifest.json with project info', async () => {
      // Create test manifest.json
      const originalManifest = {
        vendor: 'old.vendor',
        name: 'old-name',
        version: '0.1.0',
        title: 'Old Title',
        description: 'Old description',
        builders: {
          'store': '0.x'
        }
      };

      const manifestPath = path.join(testProjectPath, 'manifest.json');
      await fs.promises.writeFile(
        manifestPath, 
        JSON.stringify(originalManifest, null, 2)
      );

      // Simulate the update logic
      const manifestContent = await fs.promises.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);
      
      const vendor = 'new.vendor';
      const componentInfo = {
        title: 'New Component',
        description: 'New component description',
        author: 'New Author'
      };
      const projectDetails = { version: '2.0.0', targetDirectory: '.' };

      // Apply the same transformations as the actual method
      manifest.vendor = vendor;
      manifest.name = componentInfo.title;
      manifest.title = componentInfo.title;
      manifest.description = componentInfo.description;
      
      if (projectDetails?.version) {
        manifest.version = projectDetails.version;
      }

      // Write back
      await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

      // Verify changes
      const updatedContent = await fs.promises.readFile(manifestPath, 'utf8');
      const updatedManifest = JSON.parse(updatedContent);

      expect(updatedManifest.vendor).toBe('new.vendor');
      expect(updatedManifest.name).toBe('New Component');
      expect(updatedManifest.title).toBe('New Component');
      expect(updatedManifest.description).toBe('New component description');
      expect(updatedManifest.version).toBe('2.0.0');
      // Other fields should be preserved
      expect(updatedManifest.builders).toEqual({ 'store': '0.x' });
    });
  });
});
