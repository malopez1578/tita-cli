# TITA CLI - Guías de Desarrollo

## Estándares de Código

### Configuración TypeScript
- **Compilador**: Usar configuración estricta (`strict: true`)
- **Target**: ES2020 o superior para compatibilidad con Node.js moderno
- **Module**: CommonJS para compatibilidad CLI
- **Tipos**: Evitar `any`, preferir interfaces sobre types
- **Imports**: Usar imports absolutos cuando sea posible

### Formateo y Linting

#### Prettier (Configurado automáticamente)
```json
{
  "requireConfig": true,
  "formatOnSave": true
}
```

#### SonarLint (Configurado)
- Regla `typescript:S6440` habilitada (complejidad cognitiva)
- Servidor SonarQube conectado: `http://18.191.108.243:9000`
- Análisis automático en archivos TypeScript

### Estructura de Archivos

#### Organización de Imports
```typescript
// 1. Imports de Node.js/externos
import { promises as fs } from 'fs';
import chalk from 'chalk';

// 2. Imports internos (utils, types, etc.)
import { ValidationUtils } from '../utils/validation';
import { TitaError } from '../errors';

// 3. Imports de tipos
import type { ConfigData, TemplateInfo } from '../types';
```

#### Estructura de Clases
```typescript
export class ExampleService {
  // 1. Propiedades privadas
  private readonly config: ConfigManager;
  private cache: Map<string, any>;

  // 2. Constructor
  constructor(dependencies: ServiceDependencies) {
    this.config = dependencies.config;
    this.cache = new Map();
  }

  // 3. Métodos públicos
  public async executeOperation(): Promise<Result> {
    // implementación
  }

  // 4. Métodos privados
  private validateInput(input: unknown): asserts input is ValidInput {
    // validación
  }
}
```

## Patrones de Arquitectura

### Inyección de Dependencias
```typescript
// Definir contexto de dependencias
interface CommandContext {
  logger: ConsoleLogger;
  config: ConfigManager;
  validator: ValidationUtils;
}

// Pasar dependencias a través del constructor
class TitaCLI {
  constructor(private context: CommandContext) {}
  
  async createProject(options: CreateOptions): Promise<void> {
    // Usar this.context.logger, this.context.config, etc.
  }
}
```

### Manejo de Errores
```typescript
// Usar errores específicos de dominio
throw new ValidationError(
  'INVALID_VENDOR_FORMAT',
  `Vendor "${vendor}" must follow format: organization.team`,
  { vendor, expectedFormat: 'organization.team' }
);

// Capturar y re-lanzar con contexto
try {
  await this.cloneTemplate(templateUrl);
} catch (error) {
  throw new CommandExecutionError(
    'TEMPLATE_CLONE_FAILED',
    `Failed to clone template from ${templateUrl}`,
    { templateUrl, originalError: error }
  );
}
```

### Logging Estructurado
```typescript
// Usar niveles apropiados
logger.debug('Starting template validation', { templatePath });
logger.info('Template cloned successfully', { templateName, duration });
logger.warn('Cache miss, cloning from remote', { templateUrl });
logger.error('Installation failed', { error, packagePath });

// Incluir contexto relevante
logger.info('Project created', {
  projectName,
  templateUsed,
  installationTime: `${duration}ms`,
  cacheHit: wasCached
});
```

## Patrones de Performance

### Operaciones Asíncronas
```typescript
// Preferir async/await sobre Promises
async function processTemplates(templates: TemplateInfo[]): Promise<Result[]> {
  // Paralelizar operaciones independientes
  const results = await Promise.allSettled(
    templates.map(template => this.processTemplate(template))
  );
  
  return results
    .filter((result): result is PromiseFulfilledResult<Result> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value);
}

// Usar Promise.allSettled para operaciones que pueden fallar
async function installDependencies(directories: string[]): Promise<void> {
  const installations = await Promise.allSettled(
    directories.map(dir => this.installer.install(dir))
  );
  
  const failures = installations
    .filter(result => result.status === 'rejected')
    .map((result, index) => ({ 
      directory: directories[index], 
      error: result.reason 
    }));
    
  if (failures.length > 0) {
    logger.warn('Some installations failed', { failures });
  }
}
```

### Gestión de Memoria
```typescript
// Limpiar recursos después de uso
class TemplateProcessor {
  private tempDirectories: Set<string> = new Set();
  
  async processTemplate(templateUrl: string): Promise<void> {
    const tempDir = await this.createTempDirectory();
    this.tempDirectories.add(tempDir);
    
    try {
      // procesar template
    } finally {
      await this.cleanupTempDirectory(tempDir);
      this.tempDirectories.delete(tempDir);
    }
  }
  
  async cleanup(): Promise<void> {
    await Promise.all(
      Array.from(this.tempDirectories)
        .map(dir => this.cleanupTempDirectory(dir))
    );
  }
}
```

## Testing Patterns

### Configuración de Mocks
```typescript
// Mock de dependencias externas en __mocks__
// __mocks__/ora.js
export default jest.fn(() => ({
  start: jest.fn().mockReturnThis(),
  succeed: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  stop: jest.fn().mockReturnThis(),
}));

// En tests, usar mocks tipados
import ora from 'ora';
const mockOra = ora as jest.MockedFunction<typeof ora>;
```

### Estructura de Tests
```typescript
describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let mockFs: jest.Mocked<typeof fs>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    configManager = new ConfigManager();
  });
  
  describe('loadConfig', () => {
    it('should load existing config from file', async () => {
      // Arrange
      const mockConfig = { defaultVendor: 'test.vendor' };
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockConfig));
      
      // Act
      const result = await configManager.loadConfig();
      
      // Assert
      expect(result).toEqual(mockConfig);
      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('.tita-cli/config.json'),
        'utf8'
      );
    });
    
    it('should handle file not found gracefully', async () => {
      // Arrange
      mockFs.readFile.mockRejectedValue(new Error('ENOENT'));
      
      // Act & Assert
      await expect(configManager.loadConfig()).resolves.not.toThrow();
    });
  });
});
```

## Configuración de Herramientas

### VS Code Tasks (recomendado)
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "build",
      "type": "shell",
      "command": "yarn build",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "test",
      "type": "shell",
      "command": "yarn test",
      "group": "test"
    },
    {
      "label": "test:watch",
      "type": "shell",
      "command": "yarn test --watch",
      "group": "test",
      "isBackground": true
    }
  ]
}
```

### Debug Configuration
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug CLI",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/dist/index.js",
      "args": ["create", "test-project"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "sourceMaps": true,
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

## Flujo de Desarrollo

### Workflow Recomendado
1. **Setup inicial**:
   ```bash
   yarn install
   yarn build
   ```

2. **Desarrollo**:
   ```bash
   # Terminal 1: Build en modo watch
   yarn build --watch
   
   # Terminal 2: Tests en modo watch
   yarn test --watch
   
   # Terminal 3: Desarrollo/testing manual
   node dist/index.js create test-project
   ```

3. **Pre-commit**:
   ```bash
   yarn lint
   yarn test
   yarn build
   ```

### Git Workflow
- **Commits**: Firmados automáticamente (configurado en VS Code)
- **Mensajes**: Usar conventional commits
- **Branches**: Feature branches desde `main`
- **Pull Requests**: Requerir review y tests passing

## Optimizaciones Específicas

### File System Operations
```typescript
// Usar operaciones asíncronas en lotes
async function processFiles(filePaths: string[]): Promise<void> {
  // Procesar en chunks para evitar sobrecarga
  const CHUNK_SIZE = 10;
  for (let i = 0; i < filePaths.length; i += CHUNK_SIZE) {
    const chunk = filePaths.slice(i, i + CHUNK_SIZE);
    await Promise.all(chunk.map(path => this.processFile(path)));
  }
}

// Usar streams para archivos grandes
async function copyLargeFile(source: string, dest: string): Promise<void> {
  const readable = createReadStream(source);
  const writable = createWriteStream(dest);
  await pipeline(readable, writable);
}
```

### Cache Strategies
```typescript
// Implementar cache con TTL y LRU
class SmartCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private ttlMs: number;
  
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry || this.isExpired(entry)) {
      this.cache.delete(key);
      return undefined;
    }
    
    // Actualizar posición LRU
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }
  
  set(key: string, value: T): void {
    // Limpiar entradas expiradas
    this.cleanupExpired();
    
    // Aplicar límite LRU
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
}
```

## Troubleshooting Común

### Problemas de TypeScript
- **Error de tipos**: Asegurar que todos los types estén correctamente importados
- **Compilación lenta**: Verificar que `incremental: true` esté en tsconfig.json
- **Imports no resueltos**: Usar paths absolutos o verificar configuración de módulos

### Problemas de Testing
- **Mocks no funcionan**: Verificar que `__mocks__` esté en la ubicación correcta
- **Tests lentos**: Usar `--runInBand` para debugging, `--maxWorkers` para optimización
- **Coverage incompleto**: Verificar configuración `collectCoverageFrom` en Jest

### Problemas de Performance
- **CLI lento**: Perfilar con `--inspect` y Chrome DevTools
- **Memoria alta**: Usar `--inspect` con heap snapshots
- **I/O bloqueante**: Asegurar que todas las operaciones de archivo sean asíncronas
