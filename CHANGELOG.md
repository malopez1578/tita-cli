# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-06-09

### Added
- Initial release of TITA CLI
- Template cloning from GitLab repositories
- Automatic dependency installation with Yarn
- Interactive project creation with `tita init`
- Direct project creation with `tita create`
- Template management with `tita add-template`
- Automatic manifest.json configuration
- Component information setup (vendor, name, title, description)
- Recursive package.json detection and installation
- Git repository initialization with clean history
- Modern CLI interface with colors and spinners
- Comprehensive error handling and user feedback

### Features
- **Template Selection**: Choose from predefined GitLab templates
- **Smart Naming**: Automatic component naming from project name
- **Dependency Management**: Yarn installation in all subdirectories
- **Manifest Configuration**: Automatic vendor and component info setup
- **Git Integration**: Clean repository initialization with initial commit
- **Interactive Mode**: Guided project creation with prompts
- **CLI Options**: Direct command-line options for all parameters
- **Template Management**: Add and manage custom templates
- **Prerequisites Check**: Automatic verification of Git and Yarn

### Supported Commands
- `tita init` - Interactive project creation
- `tita create <template> <project>` - Direct project creation
- `tita list` - List available templates
- `tita add-template` - Add new templates
- `tita examples` - Show usage examples
- `tita remove` - Interactive directory removal

## [1.1.0] - 2025-06-10

### ⚡ Optimizaciones de Rendimiento Mayores

#### 🚀 Nuevas Funcionalidades
- **SmartCache**: Sistema de caché inteligente con TTL (24h) y gestión de tamaño (500MB)
- **ParallelInstaller**: Instalación paralela de dependencias en lotes (hasta 3x más rápido)
- **OptimizedCloner**: Clonación shallow automática con fallback inteligente (3-10x menos datos)
- **FastFileFinder**: Búsqueda optimizada de archivos con límites de profundidad
- **Comando `tita perf`**: Gestión de rendimiento y estadísticas de caché

#### 🔧 Mejoras del Sistema
- **Caché Inteligente**: Templates almacenados localmente con metadata de uso
- **Clonación Optimizada**: `--depth=1` por defecto, fallback a clonación completa si falla
- **Instalación Concurrente**: Máximo 3 procesos yarn paralelos para evitar sobrecarga
- **Búsqueda Eficiente**: Límites de profundidad y patrones de ignore para node_modules
- **Logger Mejorado**: Nuevo método `warning()` para mejor categorización

#### 📊 Nuevos Comandos
- `tita perf --stats`: Estadísticas detalladas de rendimiento y uso de caché
- `tita perf --clean`: Limpieza automática de caché antiguo (>7 días)
- `tita perf --optimize`: Optimización completa del sistema de caché
- `tita perf --clear-all`: Limpieza total del caché con confirmación
- `tita cache`: Comandos actualizados para usar SmartCache

#### 🎯 Mejoras de Rendimiento
- **Template Caching**: Descarga una vez, usa infinitas veces
- **Dependency Installation**: 3x más rápido con instalación paralela
- **Git Cloning**: 3-10x menos datos con shallow cloning
- **File Searching**: Búsqueda optimizada con profundidad limitada
- **Cache Management**: Gestión automática de TTL y límites de tamaño

#### 🛠️ Cambios Técnicos
- Reemplazado templateCache con SmartCache en toda la aplicación
- Actualizado findManifestFile para usar FastFileFinder
- Removido método obsoleto findPackageJsonFiles
- Agregado soporte para métodos públicos en SmartCache
- Tests actualizados para incluir nuevo método warning()
