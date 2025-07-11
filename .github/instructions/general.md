# TITA CLI - Instrucciones Generales para IA

## Resumen del Proyecto
TITA CLI es una herramienta de línea de comandos profesional para crear proyectos desde plantillas de GitLab con instalación automática de dependencias, caché inteligente y configuración persistente. Está diseñada para optimizar el flujo de trabajo de desarrollo VTEX/TITA.

## Arquitectura Principal

### Estructura del Proyecto
```
TITA_CLI/
├── src/
│   ├── index.ts              # Punto de entrada principal con clase TitaCLI
│   ├── config/               # Gestión de configuración
│   │   └── index.ts          # ConfigManager singleton
│   ├── errors/               # Jerarquía de clases de error personalizadas
│   │   └── index.ts          # TitaError, CommandExecutionError, etc.
│   ├── services/             # Servicios de lógica de negocio
│   │   └── templateCache.ts  # Caché y gestión de plantillas
│   ├── types/                # Interfaces y enums de TypeScript
│   │   └── index.ts          # Definiciones de tipos principales
│   └── utils/                # Clases y funciones utilitarias
│       ├── command.ts        # CommandExecutor para comandos shell
│       ├── logger.ts         # Implementación ConsoleLogger
│       ├── validation.ts     # ValidationUtils
│       ├── optimized-cloner.ts    # Clonado git optimizado
│       ├── parallel-installer.ts  # Instalación paralela de dependencias
│       ├── smart-cache.ts         # Sistema de caché inteligente
│       ├── fast-file-finder.ts    # Búsqueda optimizada de archivos
│       └── update-checker.ts      # Notificaciones de auto-actualización
├── constants/
│   └── templates.ts          # Configuración URL_TEMPLATES
├── tests/                    # Suite de tests Jest con mocks
└── dist/                     # Salida JavaScript compilada
```

## Tecnologías y Patrones Clave

### Stack Tecnológico
- **Lenguaje**: TypeScript con tipado estricto
- **Framework CLI**: Commander.js
- **Bibliotecas UI**: Chalk (colores), Ora (spinners), Inquirer (prompts), Figlet (banners)
- **Testing**: Jest con TypeScript, dependencias mockeadas
- **Build**: Compilador TypeScript con salida CommonJS
- **Package Manager**: Yarn para gestión de dependencias
- **Arquitectura**: Patrón Singleton, Inyección de dependencias, Orientado a servicios

### Configuración del Editor (VS Code)
- **Formateo**: Prettier automático al guardar (`formatOnSave: true`)
- **Linting**: SonarLint conectado con reglas TypeScript habilitadas
- **TypeScript**: Validación habilitada, imports automáticos actualizados
- **Git**: Firma de commits habilitada, autofetch activado
- **Copilot**: Características experimentales habilitadas, archivos de instrucción activados

## Componentes Principales

### 1. Clase CLI Principal (src/index.ts)
- Clase `TitaCLI` orquesta todas las operaciones
- Usa `CommandContext` para inyección de dependencias
- Implementa selección interactiva de plantillas con plantillas preferidas
- Maneja flujo de creación: clonar → instalar → configurar → git init
- Punto de entrada exporta funcionalidad CLI para instalación global

### 2. Sistema de Configuración (src/config/index.ts)
- `ConfigManager` singleton para preferencias persistentes del usuario
- Configuración almacenada en `~/.tita-cli/config.json`
- Soporta: defaultVendor, defaultAuthor, preferredTemplates, cacheDirectory, logLevel
- Migración automática y manejo de valores por defecto
- Configuración basada en variables de entorno

### 3. Manejo de Errores (src/errors/index.ts)
- Sistema jerárquico de errores con clase base `TitaError`
- Errores específicos: `CommandExecutionError`, `ValidationError`, `PrerequisiteError`, etc.
- Todos los errores incluyen `code`, `message` y `details` opcional
- Diseñados para mensajes de error accionables
- Soporte para contexto de error y preservación de stack trace

### 4. Servicios de Optimización de Rendimiento
- **OptimizedCloner**: Clonado superficial (`--depth=1`) con fallback
- **ParallelInstaller**: Instalaciones yarn concurrentes (máx 3 procesos)
- **SmartCache**: Caché de plantillas basado en TTL con gestión de tamaño
- **FastFileFinder**: Búsqueda de archivos limitada por profundidad con patrones de ignorar

### 5. Sistema de Plantillas
- Plantillas definidas en `constants/templates.ts` como `URL_TEMPLATES`
- Soporta URLs SSH de GitLab para repositorios privados
- Categorías de plantillas: 'components', 'theme', 'theme-b2b'
- Generación automática de metadatos de plantillas

## Flujo de Trabajo Principal

### Procesamiento de Plantillas
1. **Selección**: Selección interactiva con plantillas preferidas primero
2. **Caché**: Verificar caché, clonar si es necesario, validar integridad
3. **Clonado**: Clonado superficial optimizado con limpieza automática
4. **Instalación**: Instalación yarn paralela en todos los subdirectorios
5. **Configuración**: Actualizar manifest.json con detalles proporcionados por el usuario
6. **Configuración Git**: Inicializar repositorio git con commit inicial

### Manejo de manifest.json
- Siempre hacer backup antes de modificación
- Campos requeridos: vendor, name, title, description
- Validación de formato de vendor y nombres de componentes
- Manejo automático de versiones (preservar existente o default "0.1.0")

## Consideraciones de Rendimiento

### Prioridades de Optimización
1. **Red**: Minimizar datos de clonado git con clonado superficial
2. **I/O**: Instalación paralela de dependencias, búsqueda inteligente de archivos
3. **Memoria**: Caché de plantillas con límites de tamaño, limpieza después de operaciones
4. **Experiencia de Usuario**: Verificaciones de actualización en segundo plano, indicadores de progreso

### Rutas Críticas de Rendimiento
- Clonado de plantillas (optimizado con clonado superficial)
- Instalación de dependencias (paralelizado entre directorios)
- Búsqueda de archivos (limitado por profundidad con patrones de ignorar)
- Operaciones de caché (indexado con metadatos)

## Gestión de Caché

### Configuración de Caché
- TTL de 24 horas para plantillas
- Límite de tamaño de 500MB con expulsión LRU
- Verificación de integridad con validación hash
- Seguimiento de estadísticas para optimización

### Ubicaciones de Caché
- Directorio por defecto: `~/.tita-cli/cache/`
- Configurable a través de `ConfigManager`
- Limpieza automática basada en políticas

## Patrones de Nomenclatura

### Archivos y Directorios
- **Archivos**: kebab-case (`optimized-cloner.ts`, `template-cache.ts`)
- **Clases**: PascalCase (`ConfigManager`, `TitaCLI`)
- **Métodos/Variables**: camelCase
- **Constantes**: SCREAMING_SNAKE_CASE (`URL_TEMPLATES`)

### Git y Versionado
- Commits firmados habilitados
- Mensajes de commit descriptivos
- Versionado semántico para releases
- Uso de conventional commits para automatización

## Consideraciones de Seguridad
- Validar todas las entradas de usuario antes de operaciones del sistema de archivos
- Sanitizar rutas de archivos para prevenir directory traversal
- Validar URLs git antes de clonar
- Manejar datos sensibles (tokens, credenciales) de forma segura
- Usar HTTPS cuando sea posible, SSH para repositorios privados

## Puntos de Extensión

### Agregar Nuevas Plantillas
1. Agregar a `constants/templates.ts` en `URL_TEMPLATES`
2. Asegurar que la plantilla sigue la estructura esperada (package.json, manifest.json)
3. Probar proceso de clonado e instalación
4. Considerar agregar a plantillas preferidas por defecto

### Agregar Nuevos Comandos
1. Agregar comando a definición de programa en `src/index.ts`
2. Crear método manejador en clase `TitaCLI`
3. Agregar manejo apropiado de errores y logging
4. Escribir tests para nueva funcionalidad

### Mejoras de Rendimiento
1. Monitorear tasas de hit del caché y ajustar TTL
2. Perfilar tiempos de instalación de dependencias
3. Optimizar patrones de búsqueda de archivos
4. Considerar oportunidades adicionales de paralelización
