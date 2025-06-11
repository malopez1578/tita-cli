# Guía de Publicación en NPM

Esta guía te ayudará a publicar TITA CLI en npm paso a paso.

## 📋 Prerrequisitos

1. **Cuenta de npm**: Crea una cuenta en [npmjs.com](https://www.npmjs.com)
2. **npm CLI**: Asegúrate de tener npm instalado
3. **Autenticación**: Inicia sesión en npm

## 🔧 Configuración Inicial

### 1. Configurar tu información personal

Edita el `package.json` y reemplaza:
- `@malopez1578/tita-cli` → `@tu-username-real/tita-cli`
- `"Tu Nombre"` → Tu nombre real
- `"tu-email@example.com"` → Tu email real
- `"https://github.com/tu-username"` → Tu URL de GitHub real

### 2. Crear repositorio en GitHub

```bash
# Inicializar git (si no está inicializado)
git init

# Agregar remote origin
git remote add origin https://github.com/tu-username/tita-cli.git

# Primer commit
git add .
git commit -m "Initial commit - TITA CLI v1.0.0"
git push -u origin main
```

### 3. Autenticarse en npm

```bash
# Iniciar sesión en npm
npm login

# Verificar autenticación
npm whoami
```

## 🚀 Proceso de Publicación

### Método 1: Script Automático (Recomendado)

```bash
# Ejecutar script de publicación
./publish.sh
```

El script te guiará a través de:
- Verificación de prerrequisitos
- Selección de tipo de versión
- Compilación automática
- Publicación en npm
- Creación de tags de Git

### Método 2: Manual

```bash
# 1. Limpiar y compilar
npm run clean
npm run build

# 2. Incrementar versión (patch/minor/major)
npm version patch

# 3. Publicar
npm publish --access public

# 4. Crear tag y push a Git
git push origin main
git push --tags
```

## 📦 Verificación Post-Publicación

### 1. Verificar en npm

```bash
# Buscar tu paquete
npm search @malopez1578/tita-cli

# Ver información del paquete
npm info @malopez1578/tita-cli
```

### 2. Probar instalación

```bash
# Instalar globalmente
npm install -g @malopez1578/tita-cli

# Probar funcionamiento
tita --help
```

### 3. Verificar en navegador

- Visita: `https://www.npmjs.com/package/@malopez1578/tita-cli`
- Verifica que toda la información sea correcta

## 🔄 Actualizaciones

### Para futuras versiones:

1. **Hacer cambios en el código**
2. **Actualizar CHANGELOG.md**
3. **Ejecutar `./publish.sh`**
4. **Crear release en GitHub**

### Tipos de versión:

- **patch**: Bug fixes (1.0.0 → 1.0.1)
- **minor**: New features (1.0.0 → 1.1.0)
- **major**: Breaking changes (1.0.0 → 2.0.0)

## 🏷️ Configuración de Scoped Package

Si quieres usar un scoped package (recomendado):

```json
{
  "name": "@malopez1578/tita-cli",
  "publishConfig": {
    "access": "public"
  }
}
```

## 🛠️ Configuraciones Adicionales

### Badge de versión en README

```markdown
[![npm version](https://badge.fury.io/js/@tu-username%2Ftita-cli.svg)](https://badge.fury.io/js/@tu-username%2Ftita-cli)
```

### Configurar CI/CD (GitHub Actions)

Crea `.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
          registry-url: 'https://registry.npmjs.org'
      - run: yarn install
      - run: yarn build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## ❌ Solución de Problemas

### Error: "Package already exists"
- Cambia el nombre en `package.json`
- Usa un scoped package: `@malopez1578/nombre`

### Error: "Not authenticated"
- Ejecuta `npm login`
- Verifica con `npm whoami`

### Error: "Access denied"
- Para scoped packages, usa `--access public`
- Verifica los permisos de tu cuenta npm

### Error: "Version already exists"
- Incrementa la versión con `npm version patch/minor/major`

## 📞 Soporte

Si tienes problemas:
1. Revisa la [documentación de npm](https://docs.npmjs.com/)
2. Consulta este archivo
3. Crea un issue en el repositorio
