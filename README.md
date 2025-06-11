# TITA CLI 🚀

[![npm version](https://badge.fury.io/js/@tu-username%2Ftita-cli.svg)](https://badge.fury.io/js/@tu-username%2Ftita-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](https://github.com/tu-username/tita-cli)
[![TypeScript](https://img.shields.io/badge/typescript-5.8-blue.svg)](https://www.typescriptlang.org/)

Una herramienta de línea de comandos profesional para crear proyectos desde templates de GitLab con instalación automática de dependencias, gestión inteligente de caché y configuración persistente.

## ✨ Características

### 🎯 **Funcionalidades Core**
- **Clonación inteligente** de templates desde GitLab
- **Instalación automática** con Yarn en todos los subdirectorios
- **Configuración completa** de manifest.json (vendor, name, title, description)
- **Interfaz moderna** con colores y spinners animados
- **Verificación de prerrequisitos** automática
- **Inicialización Git** automática con commit inicial

### 🚀 **Funcionalidades Avanzadas**
- **🗄️ Caché inteligente de templates** - Descarga una vez, usa muchas veces
- **⚙️ Configuración persistente** - Recuerda tus preferencias
- **📝 Sistema de logging estructurado** - Logs detallados y configurables
- **🛡️ Validación robusta** - Protección contra errores comunes
- **🔧 Gestión de errores avanzada** - Mensajes de error útiles y accionables
- **📊 Estadísticas de caché** - Monitoreo del uso y rendimiento

### 🚀 **Optimizaciones de Rendimiento** ⚡
- **🔄 Clonado Shallow** - Clonación hasta 10x más rápida usando `--depth=1`
- **⚙️ Instalación Paralela** - Dependencias instaladas en lotes paralelos (hasta 3x más rápido)
- **🧠 Caché Inteligente** - Templates almacenados localmente con TTL y gestión de tamaño
- **🔍 Búsqueda Optimizada** - Búsqueda de archivos con límites de profundidad
- **📈 Métricas de Rendimiento** - Estadísticas detalladas de uso y eficiencia

### 🎨 **Experiencia de Usuario**
- **Modo interactivo** con prompts inteligentes
- **Templates preferidos** mostrados primero
- **Gestión dinámica** de templates
- **Comandos de configuración** fáciles de usar
- **Feedback visual** con indicadores de progreso

## 🚀 Instalación

### Instalación Global (Recomendado)

```bash
# Con npm
npm install -g @malopez1578/tita-cli

# Con yarn
yarn global add @malopez1578/tita-cli
```

### Instalación Local

```bash
# Con npm
npm install @malopez1578/tita-cli

# Con yarn
yarn add @malopez1578/tita-cli

# Ejecutar localmente
npx @malopez1578/tita-cli
```

## 📋 Prerrequisitos

- **Node.js** (v16 o superior)
- **Git** (para clonación de repositorios)
- **Yarn** (para instalación de dependencias)

## 🎯 Inicio Rápido

```bash
# Instalar globalmente
npm install -g @malopez1578/tita-cli

# Crear tu primer proyecto
tita init
```

## 🚀 Instalación Desde Código Fuente (Para Desarrollo)

```bash
# Clonar el repositorio
git clone https://github.com/tu-username/tita-cli.git
cd tita-cli

# Instalar dependencias
yarn install

# Compilar el proyecto
yarn build

# Instalar globalmente para desarrollo
yarn link-global
```

## 📖 Uso

### Comandos disponibles

```bash
# Ver ayuda general
tita --help

# Listar templates disponibles
tita list

# Crear proyecto desde template
tita create

# Gestión de caché inteligente
tita cache --stats              # Ver estadísticas de caché
tita cache --list               # Listar templates en caché
tita cache --clear              # Limpiar caché

# Gestión de configuración
tita config --show              # Mostrar configuración actual
tita config --reset             # Resetear configuración
tita config --set-vendor <name> # Establecer vendor por defecto
tita config --set-log-level <level> # Establecer nivel de logging

# Comandos de rendimiento ⚡
tita perf --stats               # Ver estadísticas de rendimiento
tita perf --clean               # Limpiar caché antiguo (>7 días)
tita perf --optimize            # Optimizar caché completo
tita perf --clear-all           # Limpiar todo el caché
```

### Opciones del comando create

- `-d, --directory <dir>`: Directorio de destino (por defecto: directorio actual)
- `-v, --vendor <vendor>`: Nombre del vendor para manifest.json
- `-n, --name <name>`: Nombre del componente para manifest.json (opcional, usa projectName por defecto)
- `-t, --title <title>`: Título del componente para manifest.json
- `--desc <description>`: Descripción del componente para manifest.json

### Ejemplos de uso

```bash
# Crear proyecto básico (solicita información interactivamente)
tita create components mi-nuevo-proyecto

# Crear proyecto con información del componente (usa el nombre del proyecto como nombre del componente)
tita create components mi-proyecto \
  --vendor "MiEmpresa" \
  --title "Mi Componente Genial" \
  --desc "Un componente increíble para mi tienda"

# Crear proyecto con nombre de componente personalizado
tita create components mi-proyecto \
  --vendor "MiEmpresa" \
  --name "componente-personalizado" \
  --title "Mi Componente Personalizado" \
  --desc "Un componente con nombre específico"

# Crear proyecto en directorio específico
tita create components mi-proyecto --directory /path/to/projects

# Usar modo interactivo (incluye todos los prompts)
tita init
```

## 🎯 Templates disponibles

Los templates se configuran en `constants/templates.ts`:

```typescript
export const URL_TEMPLATES = {
    'components': 'git@gitlab.com:titadev/tita-quality/quality-template.git',
    // Agrega más templates aquí
}
```

## 🔧 Desarrollo

```bash
# Modo desarrollo con recarga automática
yarn dev

# Compilar proyecto
yarn build

# Limpiar archivos compilados
yarn clean

# Instalar globalmente para testing
yarn link-global

# Desinstalar versión global
yarn unlink-global
```

## 🏗️ Proceso de creación de proyecto

1. **Verificación de prerrequisitos** (Git, Yarn)
2. **Selección de template** (en modo interactivo)
3. **Captura de detalles** del proyecto (nombre, directorio)
4. **Solicitud de información del vendor** 
5. **Solicitud de información del componente** (title, description - el name se toma del projectName)
6. **Clonación** del template desde GitLab
7. **Limpieza** del historial Git original
8. **Actualización completa** del manifest.json con toda la información
9. **Búsqueda recursiva** de archivos `package.json`
10. **Instalación automática** con `yarn install` en cada directorio
11. **Inicialización** de nuevo repositorio Git
12. **Commit inicial** con el código del template

## 📁 Estructura del proyecto

```
TITA_CLI/
├── index.ts                 # Código principal del CLI
├── constants/
│   └── templates.ts         # Configuración de templates
├── package.json             # Configuración del proyecto
├── tsconfig.json           # Configuración TypeScript
└── dist/                   # Código compilado
    └── index.js            # Ejecutable del CLI
```

## 🎨 Características visuales

- **Banner ASCII** con figlet
- **Colores vibrantes** con chalk
- **Spinners animados** con ora
- **Prompts interactivos** con inquirer
- **Feedback visual** en tiempo real

## 📝 Notas

- El CLI busca automáticamente archivos `package.json` en todos los subdirectorios
- Excluye `node_modules` y `.git` de la búsqueda
- Maneja errores de forma elegante con mensajes informativos
- Soporta tanto URLs SSH como HTTPS de GitLab
- Actualiza automáticamente el archivo `manifest.json` con información completa del componente
- Busca el archivo `manifest.json` en múltiples ubicaciones comunes del proyecto
- **El nombre del componente se toma automáticamente del nombre del proyecto** (evita duplicación)
- Permite especificar información del componente via CLI o mediante prompts interactivos

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Desarrollo Local

```bash
# Instalar dependencias
yarn install

# Compilar en modo desarrollo
yarn dev

# Compilar para producción
yarn build

# Limpiar archivos compilados
yarn clean
```

## 🔄 Versionado

Este proyecto usa [SemVer](http://semver.org/) para el versionado. Para ver las versiones disponibles, consulta los [tags en este repositorio](https://github.com/tu-username/tita-cli/tags).

## 📝 Changelog

Consulta el [CHANGELOG.md](CHANGELOG.md) para ver los cambios detallados en cada versión.

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autores

- **Tu Nombre** - *Trabajo inicial* - [tu-username](https://github.com/tu-username)

## 🙏 Agradecimientos

- Inspirado en las mejores prácticas de CLIs modernas
- Construido con amor para la comunidad de desarrolladores
- Agradecimientos especiales a todos los contribuidores

## 🐛 Reportar Bugs

Si encuentras un bug, por favor abre un [issue](https://github.com/tu-username/tita-cli/issues) con:
- Descripción detallada del problema
- Pasos para reproducir
- Versión del CLI y Node.js
- Sistema operativo

## 💡 Solicitar Features

Para solicitar nuevas características, abre un [issue](https://github.com/tu-username/tita-cli/issues) con la etiqueta "enhancement".
