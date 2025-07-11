# TITA CLI - Estrategias de Testing

## Configuración de Testing

### Jest Configuration
```javascript
// jest.config.js (configuración actual del proyecto)
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
```

### Mock Setup (tests/setup.ts)
```typescript
// Configuración global de mocks
jest.mock('chalk', () => require('./__mocks__/chalk'));
jest.mock('ora', () => require('./__mocks__/ora'));
jest.mock('inquirer', () => require('./__mocks__/inquirer'));
jest.mock('figlet', () => require('./__mocks__/figlet'));

// Configuración de timeouts para operaciones lentas
jest.setTimeout(30000);

// Mock de console para tests limpios
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
```

## Estrategias de Testing por Componente

### 1. Testing de CLI Commands
```typescript
// tests/command.test.ts
import { TitaCLI } from '../src';
import { ConfigManager } from '../src/config';
import { ConsoleLogger } from '../src/utils/logger';

describe('TitaCLI Commands', () => {
  let cli: TitaCLI;
  let mockConfig: jest.Mocked<ConfigManager>;
  let mockLogger: jest.Mocked<ConsoleLogger>;

  beforeEach(() => {
    mockConfig = {
      loadConfig: jest.fn(),
      saveConfig: jest.fn(),
      getConfig: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    cli = new TitaCLI({
      config: mockConfig,
      logger: mockLogger,
    });
  });

  describe('create command', () => {
    it('should create project with valid template', async () => {
      // Arrange
      const projectName = 'test-project';
      const templateKey = 'components';
      mockConfig.getConfig.mockResolvedValue({
        preferredTemplates: [templateKey],
        defaultVendor: 'test.vendor'
      });

      // Act
      await cli.createProject({
        name: projectName,
        template: templateKey,
        vendor: 'test.vendor'
      });

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Project created successfully')
      );
    });

    it('should handle invalid template gracefully', async () => {
      // Arrange
      const invalidTemplate = 'nonexistent-template';

      // Act & Assert
      await expect(
        cli.createProject({
          name: 'test-project',
          template: invalidTemplate
        })
      ).rejects.toThrow(ValidationError);
    });
  });
});
```

### 2. Testing de Servicios
```typescript
// tests/services/templateCache.test.ts
import { TemplateCache } from '../../src/services/templateCache';
import { promises as fs } from 'fs';
import path from 'path';

jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    mkdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    stat: jest.fn(),
    rm: jest.fn(),
  }
}));

describe('TemplateCache', () => {
  let templateCache: TemplateCache;
  let mockFs: jest.Mocked<typeof fs>;

  beforeEach(() => {
    mockFs = fs as jest.Mocked<typeof fs>;
    templateCache = new TemplateCache('/tmp/test-cache');
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return cached template if valid', async () => {
      // Arrange
      const templateKey = 'test-template';
      const cachedData = {
        path: '/cache/test-template',
        timestamp: Date.now(),
        hash: 'abc123'
      };
      
      mockFs.readFile.mockResolvedValue(JSON.stringify(cachedData));
      mockFs.access.mockResolvedValue(undefined);

      // Act
      const result = await templateCache.get(templateKey);

      // Assert
      expect(result).toEqual(cachedData);
      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('test-template.json'),
        'utf8'
      );
    });

    it('should return null for expired cache', async () => {
      // Arrange
      const expiredData = {
        path: '/cache/test-template',
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        hash: 'abc123'
      };
      
      mockFs.readFile.mockResolvedValue(JSON.stringify(expiredData));

      // Act
      const result = await templateCache.get('test-template');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should save template data to cache', async () => {
      // Arrange
      const templateKey = 'test-template';
      const templateData = {
        path: '/tmp/template',
        timestamp: Date.now(),
        hash: 'def456'
      };

      mockFs.writeFile.mockResolvedValue(undefined);

      // Act
      await templateCache.set(templateKey, templateData);

      // Assert
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('test-template.json'),
        JSON.stringify(templateData, null, 2),
        'utf8'
      );
    });
  });
});
```

### 3. Testing de Utilities
```typescript
// tests/utils/validation.test.ts
import { ValidationUtils } from '../../src/utils/validation';
import { ValidationError } from '../../src/errors';

describe('ValidationUtils', () => {
  describe('validateVendorFormat', () => {
    const validVendors = [
      'organization.team',
      'company.department',
      'org123.team456'
    ];

    const invalidVendors = [
      'invalid',
      'too.many.dots.here',
      '',
      'spaces in.vendor',
      '.startswithd ot',
      'endswith.'
    ];

    test.each(validVendors)('should accept valid vendor: %s', (vendor) => {
      expect(() => ValidationUtils.validateVendorFormat(vendor))
        .not.toThrow();
    });

    test.each(invalidVendors)('should reject invalid vendor: %s', (vendor) => {
      expect(() => ValidationUtils.validateVendorFormat(vendor))
        .toThrow(ValidationError);
    });
  });

  describe('validateProjectName', () => {
    it('should accept valid project names', () => {
      const validNames = ['my-project', 'project123', 'valid_name'];
      
      validNames.forEach(name => {
        expect(() => ValidationUtils.validateProjectName(name))
          .not.toThrow();
      });
    });

    it('should reject invalid project names', () => {
      const invalidNames = ['', 'spaces in name', 'UPPERCASE', '123start'];
      
      invalidNames.forEach(name => {
        expect(() => ValidationUtils.validateProjectName(name))
          .toThrow(ValidationError);
      });
    });
  });
});
```

### 4. Testing de Error Handling
```typescript
// tests/errors/index.test.ts
import { 
  TitaError, 
  CommandExecutionError, 
  ValidationError 
} from '../../src/errors';

describe('Error Classes', () => {
  describe('TitaError', () => {
    it('should create error with code and message', () => {
      const error = new TitaError('TEST_ERROR', 'Test message');
      
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test message');
      expect(error.name).toBe('TitaError');
      expect(error.details).toBeUndefined();
    });

    it('should create error with details', () => {
      const details = { field: 'value' };
      const error = new TitaError('TEST_ERROR', 'Test message', details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('CommandExecutionError', () => {
    it('should inherit from TitaError', () => {
      const error = new CommandExecutionError(
        'COMMAND_FAILED', 
        'Command failed'
      );
      
      expect(error).toBeInstanceOf(TitaError);
      expect(error.name).toBe('CommandExecutionError');
    });
  });

  describe('ValidationError', () => {
    it('should provide validation context', () => {
      const error = new ValidationError(
        'INVALID_INPUT',
        'Invalid vendor format',
        { 
          field: 'vendor',
          value: 'invalid-vendor',
          expected: 'organization.team'
        }
      );
      
      expect(error.details).toEqual({
        field: 'vendor',
        value: 'invalid-vendor',
        expected: 'organization.team'
      });
    });
  });
});
```

## Testing de Integraciones

### File System Operations
```typescript
// tests/integration/filesystem.test.ts
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { OptimizedCloner } from '../../src/utils/optimized-cloner';

describe('File System Integration', () => {
  let tempDir: string;
  let cloner: OptimizedCloner;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tita-test-'));
    cloner = new OptimizedCloner(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should clone repository successfully', async () => {
    // Note: Use a real public repository for this test
    const testRepo = 'https://github.com/octocat/Hello-World.git';
    const targetPath = path.join(tempDir, 'cloned-repo');

    await cloner.clone(testRepo, targetPath);

    const exists = await fs.access(targetPath).then(() => true, () => false);
    expect(exists).toBe(true);

    const files = await fs.readdir(targetPath);
    expect(files.length).toBeGreaterThan(0);
  }, 30000); // Increased timeout for network operation
});
```

### Command Execution
```typescript
// tests/integration/commands.test.ts
import { CommandExecutor } from '../../src/utils/command';
import { ConsoleLogger } from '../../src/utils/logger';

describe('Command Execution Integration', () => {
  let executor: CommandExecutor;
  let logger: ConsoleLogger;

  beforeEach(() => {
    logger = new ConsoleLogger('debug');
    executor = new CommandExecutor(logger);
  });

  it('should execute simple commands', async () => {
    const result = await executor.execute('echo "test"', '/tmp');
    
    expect(result.success).toBe(true);
    expect(result.output).toContain('test');
  });

  it('should handle command failures', async () => {
    const result = await executor.execute('nonexistent-command', '/tmp');
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should respect working directory', async () => {
    const result = await executor.execute('pwd', '/tmp');
    
    expect(result.success).toBe(true);
    expect(result.output.trim()).toBe('/tmp');
  });
});
```

## Performance Testing

### Benchmarking Critical Paths
```typescript
// tests/performance/cloning.test.ts
import { performance } from 'perf_hooks';
import { OptimizedCloner } from '../../src/utils/optimized-cloner';

describe('Performance Tests', () => {
  let cloner: OptimizedCloner;

  beforeEach(() => {
    cloner = new OptimizedCloner('/tmp/perf-test');
  });

  it('should clone within acceptable time limits', async () => {
    const start = performance.now();
    
    // Test with a small repository
    await cloner.clone(
      'https://github.com/octocat/Hello-World.git',
      '/tmp/perf-test/hello-world'
    );
    
    const duration = performance.now() - start;
    
    // Should complete within 10 seconds
    expect(duration).toBeLessThan(10000);
  }, 15000);

  it('should show performance improvement with shallow clone', async () => {
    const shallowStart = performance.now();
    await cloner.clone(
      'https://github.com/octocat/Hello-World.git',
      '/tmp/perf-test/shallow',
      { shallow: true }
    );
    const shallowDuration = performance.now() - shallowStart;

    const fullStart = performance.now();
    await cloner.clone(
      'https://github.com/octocat/Hello-World.git',
      '/tmp/perf-test/full',
      { shallow: false }
    );
    const fullDuration = performance.now() - fullStart;

    // Shallow clone should be significantly faster
    expect(shallowDuration).toBeLessThan(fullDuration * 0.8);
  }, 30000);
});
```

## Testing Best Practices

### 1. Test Organization
```typescript
// Usar describe blocks para agrupar tests relacionados
describe('ConfigManager', () => {
  describe('constructor', () => {
    // Tests de inicialización
  });

  describe('loadConfig', () => {
    describe('when config file exists', () => {
      // Tests de casos exitosos
    });

    describe('when config file does not exist', () => {
      // Tests de casos de error
    });
  });
});
```

### 2. Test Data Management
```typescript
// tests/fixtures/index.ts
export const TEST_CONFIG = {
  defaultVendor: 'test.vendor',
  defaultAuthor: 'Test Author',
  preferredTemplates: ['components', 'theme'],
  cacheDirectory: '/tmp/test-cache',
  logLevel: 'debug' as const
};

export const TEST_TEMPLATES = {
  components: 'git@gitlab.com:test/components-template.git',
  theme: 'git@gitlab.com:test/theme-template.git'
};

export const INVALID_VENDORS = [
  '',
  'no-dot',
  'too.many.dots.here',
  'spaces in.vendor'
];
```

### 3. Async Testing Patterns
```typescript
// Usar async/await consistentemente
it('should handle async operations', async () => {
  const result = await service.performAsyncOperation();
  expect(result).toBeDefined();
});

// Testear rechazo de promesas
it('should reject on invalid input', async () => {
  await expect(service.performAsyncOperation('invalid'))
    .rejects
    .toThrow(ValidationError);
});

// Testear timeouts
it('should timeout on slow operations', async () => {
  jest.setTimeout(5000);
  
  await expect(service.slowOperation())
    .rejects
    .toThrow('Operation timed out');
});
```

### 4. Mock Strategies
```typescript
// Mock parcial de módulos
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  }
}));

// Mock de clases con implementación
jest.mock('../../src/utils/logger', () => ({
  ConsoleLogger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }))
}));

// Spy en métodos existentes
const spy = jest.spyOn(service, 'methodName')
  .mockImplementation(async () => 'mocked result');

// Restaurar después del test
afterEach(() => {
  spy.mockRestore();
});
```

## Coverage y Quality Gates

### Coverage Goals
- **Overall**: >85%
- **Critical paths**: >95% (config, validation, core CLI)
- **Utilities**: >90%
- **Error handling**: >95%

### Quality Checks
```bash
# Ejecutar con coverage
yarn test --coverage

# Verificar coverage mínimo
yarn test --coverage --coverageThreshold='{"global":{"branches":85,"functions":85,"lines":85,"statements":85}}'

# Análisis de coverage
yarn test --coverage --coverageReporters=html
# Abrir coverage/index.html para análisis detallado
```

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: yarn install --frozen-lockfile
      - run: yarn test --coverage
      - run: yarn build
      - uses: codecov/codecov-action@v1
        with:
          file: ./coverage/lcov.info
```

## Debugging Tests

### VS Code Debug Configuration
```json
{
  "name": "Debug Jest Tests",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": [
    "--runInBand",
    "--no-cache",
    "--testNamePattern=${input:testNamePattern}"
  ],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Common Debugging Techniques
```typescript
// Debug específico test
describe.only('specific test suite', () => {
  it.only('specific test', () => {
    // Solo este test se ejecutará
  });
});

// Usar console.log en tests (con cuidado)
it('debug test', () => {
  const result = service.method();
  console.log('Debug result:', result);
  expect(result).toBeDefined();
});

// Timeouts extendidos para debugging
jest.setTimeout(60000);
```
